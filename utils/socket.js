const redis = global.utils.redis;
const rabbitMQ = global.utils.rabbitMQ;

const geolib = require('geolib');
var geo = require('georedis').initialize(redis);

const messageCtrl = require('../controllers/MessageCtrl');
const dmCtrl = require('../controllers/DMCtrl');
const helpers = require('./helpers');
const errorCode = require('./error').code;
const config = require('./config');

const storeClient = (key, value) => {
  redis.hmset('clients',              // redis Key
  key,                                // redis Value / hashmap Key    (socket id)
  value);                             // redis Value / hashmap Value  (client info)
};

const storeInfo = (idx, info) => {
  redis.hmset('info',
  idx, 
  info);
}

const storeGeoInfo = (idx, position) => {
  geo.addLocation(idx, 
    { latitude: position[1], longitude: position[0] });
};

// 정보가 레디스에 존재하는지 체크하지 않아도 자동으로 갱신됩니다.
// This command overwrites any specified fields already existing in the hash.
// If key does not exist, a new key holding a hash is created.      

/* 
  레디스에 전달 받은 유저 정보를 저장하는 함수입니다.
  @param id       : 저장할 유저의 idx
  @param data     : 저장할 내용을 담은 JSON 오브젝트
         socket   : 해당 유저가 현재 물고 있는 소켓의 아이디
         position : 유저의 현재 위치
         radius   : 유저가 설정한 반경 값
         nickname : 유저의 닉네임
         avatar   : 유저의 프로필 이미지 주소
*/
exports.storeAll = (id, data) => {
  const idx = data.idx;
  
  const info = {
    socket: id,
    position: data.position,
    radius: data.radius,
    nickname: data.nickname,
    avatar: data.avatar,
  };

  if(idx && idx !== undefined){
    storeClient(id, idx);
    storeInfo(idx, JSON.stringify(info));
    storeGeoInfo(idx, data.position);
  }      
}

/* 
  해당 메시지의 좌표 값을 통해 해당 메시지를 받아볼 유저들을 추려내는 함수입니다.
  @param socket   : 연결한 소켓 자체
  @param response : 메시지의 내용
  @param event    : 클라이언트로 emit할 이벤트 이름
*/
const findUserInBound = (socket, response, event) => {
  redis.hgetall('clients', (err, object) => {
    if (err) console.log(err);
    if (!object || object === null) return;

    const messageLat = response.result.position.coordinates[1];
    const messageLng = response.result.position.coordinates[0];
    
    Object.keys(object).forEach(function (key) {
      const idx = object[key];
      redis.hmget("info", idx, (err, result) => {
        // 먼저 해당 유저의 정보를 info 키 내부에 있는 값으로 가져옵니다.
        if (err) console.log(err);

        if (result.length > 0) {
          const value = JSON.parse(result[0]);
          if (value && value !== null) {
            const distance = geolib.getDistance(
              { latitude: value.position[1], longitude: value.position[0] }, // 소켓의 현재 위치 (순서 주의!)
              { latitude: messageLat, longitude: messageLng }                // 메시지 발생 위치
            );
            if (value.radius >= distance) { 
              // 거리 값이 설정한 반경보다 작을 경우에만 이벤트를 보내줍니다.            
              socket.broadcast.to(key).emit(event, response);
            }
          }
        }
      });
    });
    socket.emit(event, response);
  });   
};


exports.init = (http) => {
  const io = require('socket.io')(http, 
    {'pingInterval': config.ping_interval, 'pingTimeout': config.ping_timeout});
  
  io.on('connection', (socket) => {
    /*******************
     * 소켓 연결
    ********************/
    // 클라에서 보내온 정보를 레디스에 저장합니다.
    socket.on('store', (data) => {
      this.storeAll(socket.id, data);
    });

    // 클라의 연결이 종료되었을 경우 레디스에서 해당 정보를 삭제합니다.
    socket.on('disconnect', () => {
      redis.hmget('clients', socket.id, (err, result) => {
        const idx = result[0];
        
        if (err) console.log(err);
        if (idx && idx !== null) {
          redis.hdel('info', idx);
          redis.zrem('geo:locations', idx);
        }
        redis.hdel('clients', socket.id);      
      });        
    });

    // 클라가 주기적으로 현재 위치를 업데이트하면 이를 레디스에서 갱신합니다.
    socket.on('update', async (type, data) => {      
      this.storeAll(socket.id, data);

      // 해당 위치와 radius에 맞는 접속자와 접속중인 친구들을 찾아 보내줍니다.
      // 유저에게 type을 받아서, 이에 맞는 정보를 찾아서 보내주면 됩니다.
      //    geo : 현재 위치와 반경 내에 존재하는 접속자 리스트 return
      //    dm  : 접속 중인 친구 리스트 return

      if (type === "geo") {
        const position = data.position;
        await new Promise((resolve, reject) => {
          // nearby @param : {위도, 경도}, 반경
          // 현재 유저의 위치로부터 유저가 설정한 반경값 이내에 존재하는 접속자만 추려냅니다.
          // + 기능 추가 : 주변에 접속중인 사람인지만 보여주지 말고, 그 유저도 내 메시지를 받아볼 수 있는지도 추가합니다.
          geo.nearby({latitude: position[1], longitude: position[0]}, data.radius, 
            (err, positions) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                resolve(positions);
              }
            });
        })
        .then((positions) => {
          return new Promise((resolve, reject) => {
            let infoList = [];

            positions.map(async (idx, i) => {
              redis.hmget('info', idx, (err, info) => {
                if (err) {
                  console.log(err);
                  reject(err);
                }
                else {
                  const json = JSON.parse(info[0]);
                  if (json !== null) {
                    // 일단 상대가 내 반경 안에 들어와 있다면, 나도 상대의 반경 안에 들어가 있는지도 체크합니다.
                    const distance = geolib.getDistance(
                      { latitude: position[1], longitude: position[0] }, // 내 위치 (순서 주의!)
                      { latitude: json.position[1], longitude: json.position[0] }    // 상대의 위치
                    );  

                    let inside = false;  // 거리가 해당 유저의 반경보다 작은 경우는 참으로 바꿉니다.
                    if (distance <= json.radius) inside = true;
                    
                    const result = {
                      idx,
                      nickname: json.nickname,
                      avatar: json.avatar,
                      inside
                    };
                    
                    infoList.push(result);

                    if (i+1 === positions.length) {
                      socket.emit("geo", infoList);
                    }
                  }
                }
              });           
            });
          });
        });     
      } else if (type === "dm"){
      // 친구 리스트를 받아와서 접속 중인 사람 중에서 추려서 돌려주면 됩니다.

      }
    });

    

    /*******************
     * 메시지 생성
    ********************/

    // 새로 메시지를 생성했을 경우에는
    socket.on('save_msg', async (data) => {
      // 1. DB에 저장하기 위해 컨트롤러를 호출합니다.
      let response = '';  
      const token = data.token;
      const messageData = data.messageData;
      messageData.testing = data.testing;
      const radius = data.radius;

      try {
        response = await messageCtrl.save(token, messageData);
      } catch (err) {
        console.log(err);
        response = errorCode[err];
      }

      const messageLat = response.result.position.coordinates[1];
      const messageLng = response.result.position.coordinates[0];

      findUserInBound(socket, response, "new_msg") ;

      // 4. 해당 메시지가 확성기 타입일 경우에는 푸시 메시지도 보내줘야 합니다.
      if (messageData.type === "LoudSpeaker") {
        rabbitMQ.channel.publish("push", "speaker", new Buffer(JSON.stringify(response)));
        // 5. 푸시 메시지를 보내줄 대상을 선별해줘야 합니다.        
        await new Promise((resolve, reject) => {
          // nearby @param : {위도, 경도}, 반경
          // 작성된 메시지로의 좌표값으로부터 주어진 반경 이내에 위치한 사용자만 추려냅니다.
          geo.nearby({latitude: messageLat, longitude: messageLng}, radius, 
            (err, positions) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                resolve(positions);
              }
            });
        })
        .then((positions) => {
          positions.map(async (idx, i) => {
            redis.hmget('info', idx, (err, info) => {
              if (err)  console.log(err);
              else {
                const json = JSON.parse(info[0]);
                socket.to(json.socket).emit("speaker", response.result);
              }
            });
          });
        });
      }
    });

    /*******************
     * 좋아요 처리
    ********************/

    socket.on('like', async (token, idx) => {
      // 1. DB에 저장하기 위해 컨트롤러를 호출한다.
      let response = '';

      try {
        response = await messageCtrl.like(token, idx);
      } catch (err) {
        console.log(err);
        response = errorCode[err];
      } finally {
        // 3. 결과물을 이 메시지를 받아보는 유저와 나에게 쏴야 합니다.
        // 기존 메시지 수신 방식이랑 동일하게 하면 됩니다.
        findUserInBound(socket, response, "apply_like");
      }      
    });


    /*******************
     * DM 생성
    ********************/

    socket.on('save_dm', async (token, messageData) => {
      // 1. DB에 저장하기 위해 컨트롤러를 호출한다.
      let response = '';

      try {
        response = await dmCtrl.save(token, messageData);
      } catch (err) {
        console.log(err);
        response = errorCode[err];
      } finally {
        // 3. 결과물을 해당 유저와 나에게 쏴야 합니다.
        // redis의 세션 목록에 해당 유저가 있는지 확인하고, 있으면 쏩니다.
        redis.hgetall('info', (err, object) => {
          if (err) console.log(err);
          const receiver = response.result.receiver;
          if (object[receiver]) { // 해당 유저가 현재 접속중일 경우에만 보내고,
            socket.broadcast.to(JSON.parse(object[receiver]).socket).emit('new_dm', response);
          }
          // 내 자신에게도 발송해줍니다!
          socket.emit('new_dm', response);
        });
      }      
    });
  });
};


// socket.conn.on('packet', function (packet) {
//   if (packet.type === 'ping') {console.log('received ping');}
// });
// socket.conn.on('packetCreate', function (packet) {
//   if (packet.type === 'pong') console.log('sending pong');
// });


// Working with W3C Geolocation API
// navigator.geolocation.getCurrentPosition(
//   function(position) {
//       alert('You are ' + geolib.getDistance(position.coords, {
//           latitude: 51.525,
//           longitude: 7.4575
//       }) + ' meters away from 51.525, 7.4575');
//   },
//   function() {
//       alert('Position could not be determined.')
//   },
//   {
//       enableHighAccuracy: true
//   }
// );