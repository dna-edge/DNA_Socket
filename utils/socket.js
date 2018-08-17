const redis = global.utils.redis;

const geolib = require('geolib');

const messageCtrl = require('../controllers/MessageCtrl');
const dmCtrl = require('../controllers/DMCtrl');
const helpers = require('./helpers');
const errorCode = require('./error').code;
const config = require('./config');

const storeClientInfo = (key, value) => {
  redis.hmset('clients',              // redis Key
  key,                                // redis Value / hashmap Key    (socket id)
  value);                             // redis Value / hashmap Value  (client info)
}
// 정보가 레디스에 존재하는지 체크하지 않아도 자동으로 갱신된다.
// This command overwrites any specified fields already existing in the hash.
// If key does not exist, a new key holding a hash is created.      

exports.init = (http) => {
  /* TODO 테스트용으로 레디스 초기화 (추후 꼭 삭제) */
  storeClientInfo("s1rzGthx73mJqJ5KAAAG", "{\"location\":[127.097622,37.591479],\"radius\":50}");       
  storeClientInfo("7WB-k5qboL6Ekp4TAAAH", "{\"location\":[127.097695,37.590571],\"radius\":50}");       
  storeClientInfo("Ubw5zXKj-2xhMuYSAAAA", "{\"location\":[127.099696,37.592049],\"radius\":50}");       
  storeClientInfo("UIZA0ogMyaXh5HyBAAAB", "{\"location\":[127.063810,37.510122],\"radius\":50}");    

  const io = require('socket.io')(http, 
    {'pingInterval': config.ping_interval, 'pingTimeout': config.ping_timeout});
  
  io.on('connection', (socket) => {
    console.log('a user connected');   

    /*******************
     * 소켓 연결
    ********************/
    // 4. 클라에서 보내온 정보를 레디스에 저장
    socket.on('store', (data) => {    
      storeClientInfo(socket.id, JSON.stringify(data));      
    });

    // 5. 클라가 주기적으로 현재 위치를 업데이트하면 이를 레디스에서 갱신한다.
    socket.on('update', (data) => {
      storeClientInfo(socket.id, JSON.stringify(data));
    });

    // 5. 클라의 연결이 종료되었을 경우 레디스에서 해당 정보를 삭제한다.
    socket.on('disconnect', function (data) {
      console.log('user disconnected');
      redis.hdel('clients', socket.id);
    });        


    /*******************
     * 메시지 생성
    ********************/

    // 새로 메시지를 생성했을 경우에는
    socket.on('save_msg', async (token, messageData) => {
      // 1. DB에 저장하기 위해 컨트롤러를 호출한다.
      let response = '';  

      try {
        response = await messageCtrl.save(token, messageData);
      } catch (err) {
        console.log(err);
        response = errorCode[err];
      }

      // 2. 레디스에 저장된 클라이언트의 리스트를 가져온다.
      const clients = redis.hgetall('clients', (err, object) => {
        if (err) {
          console.log(err);
        }
        let count = 0;
        
        Object.keys(object).forEach(function (key) { 
          // 3. 저장한 결과값을 연결된 소켓에 쏴주기 위해 필터링한다.
          const value = JSON.parse(object[key]);
          const distance = geolib.getDistance(
            { latitude: value.location[1], longitude: value.location[0] }, // 소켓의 현재 위치 (순서 주의!)
            { latitude: response.result.location.coordinates[1], 
              longitude: response.result.location.coordinates[0] }      // 메시지 발생 위치
          );
          if (value.radius >= distance) { // 거리 값이 설정한 반경보다 작을 경우에만 이벤트를 보내준다.            
            socket.broadcast.to(key).emit('new_msg', response);
            count++;
          }
        });
        console.log("message sent to ["+count+"] client");
        socket.emit('new_msg', response);
      });   
    });


    /*******************
     * DM 생성
    ********************/

    socket.on('enter', (data) => {
      console.log("a user entered");
      const room = 'room' + data.roomIdx;
      console.log("join : " + room);
      socket.join(room);
    });

    socket.on('save_dm', async (token, messageData) => {
      // 1. DB에 저장하기 위해 컨트롤러를 호출한다.
      let response = '';

      try {
        response = await dmCtrl.save(token, messageData);
      } catch (err) {
        console.log(err);
        response = errorCode[err];
      } finally {
        // 3. 저장한 결과물을 해당 room 안에 있는 클라에게 쏜다!
        const room = 'room' + response.result.roomIdx;

        console.log("to send : " + room);
        io.of('/').in(room).emit('new_dm', response);            
      }

      // // 2. 레디스에 저장된 클라이언트의 리스트를 가져온다.
      // const clients = redis.hgetall('clients', (err, result) => {
      //   let count = 0;

      //   Object.keys(result).forEach(function (key) { 
      //     // 3. 저장한 결과물을 해당 room 안에 있는 클라에게 쏜다!
      //     socket.on('save_dm', function(data) {
      //       socket.in('room' + response.data.roomIdx).emit('new_dm', data.message);            
      //     });
      //   });
      //   console.log("message sent to [room"+response.data.roomIdx+"] client");
      //   socket.emit('new_msg', response);
      // });   
      
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