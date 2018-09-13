/******************************************************************************
' 파일     : session.js
' 작성     : 박소영
' 목적     : 레디스에 저장되는 세션과 관련된 함수들을 모아논 파일입니다.
******************************************************************************/

const redis = global.utils.redis;
const geolib = require('geolib');
const async = require('async');
const helpers = require('./helpers');
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
  const position = data.position;  
  const mapKey = helpers.getMapkey(position);
  
  const info = {
    socket: id,
    position: position,
    radius: data.radius,
    nickname: data.nickname,
    avatar: data.avatar,
  };

  if(idx && idx !== undefined){
    storeHashMap("client", mapKey, id, idx);
    storeHashMap("info", mapKey, idx, JSON.stringify(info));
    storeGeo(idx, data.position, mapKey);
  }      
}

const storeHashMap = (type, mapKey, key, value) => {
  redis.hmset(mapKey + type, key, value);

  // TYPE       key         value
  // client     socket ID   user idx
  // info       user idx    user info JSON
}

const storeGeo = (idx, position, mapKey) => {
  // GEOADD key longitude latitude member
  // position = [lng, lat]

  redis.geoadd(mapKey + "geo", position[0], position[1], idx);
};
// 정보가 레디스에 존재하는지 체크하지 않아도 자동으로 갱신됩니다.
// This command overwrites any specified fields already existing in the hash.
// If key does not exist, a new key holding a hash is created.      


/* 
  해당 메시지의 좌표 값을 통해 해당 메시지를 받아볼 유저들을 추려내는 함수입니다.
  @param socket   : 연결한 소켓 자체
  @param response : 메시지의 내용
  @param event    : 클라이언트로 emit할 이벤트 이름
*/
exports.findUserInBound = (socket, response, event) => {
  const position = response.result.position.coordinates;
  const mapKey = helpers.getMapkey(position);
  
  redis.hgetall(mapKey + "client", (err, object) => {
    if (err) {
      logger.log("error", "Error: websocket error", error);
      console.log(err);
    }
    if (!object || object === null) return;

    const messageLat = response.result.position.coordinates[1];
    const messageLng = response.result.position.coordinates[0];
    
    Object.keys(object).forEach(function (key) {
      const idx = object[key];
      
      redis.hmget(mapKey + "info", idx, (err, result) => {
        // 먼저 해당 유저의 정보를 info 키 내부에 있는 값으로 가져옵니다.
        if (err) {
          logger.log("error", "Error: websocket error", error);
          console.log(err);
        }

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

/* 
  좌표 값을 주면, 해당 좌표의 타일과 옆 타일의 유저를 찾아 반환하는 함수입니다.
  @param type     : client, info, geo 중 하나
  @param position : 유저를 찾을 기준이 되는 좌표 값
*/
exports.returnSessionList = (type, position) => {
  // 먼저 현재 좌표를 이용해 현재 타일과 추가적으로 살펴야 할 타일을 구합니다.
  const lng = position[0];
  const lat = position[1];
  const lngTile = Math.floor(lng * 10);
  const latTile = Math.floor(lat * 10);
  const newLngTile = (lng - Math.floor(lng)) * 10 * 2 > 1 ? lngTile + 1 : lngTile - 1;
  const newLatTile = (lat - Math.floor(lat)) * 10 * 2 > 1 ? latTile + 1 : latTile - 1;

  const selectKeys = [
    type + lngTile + latTile,       // 기본 키
    type + lngTile + newLatTile,    // 추가로 찾아야 하는 키 (좌우)
    type + newLngTile + latTile     // 추가로 찾아야 하는 키 (상하)
  ];

  let result = [];

  selectKeys.map((key) => {
    if (type === "geo") {   // 타입이 geo일 경우엔 GEO API 사용

    } else {                // 타입이 client이거나 info일 경우엔 hash 사용
      redis.hgetall(key, (err, object) => {
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

  

}