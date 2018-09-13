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
  return new Promise(async (resolve, reject) => {
    // 먼저 현재 위치를 기반으로 client 리스트를 뽑아옵니다.
    const position = response.result.position.coordinates;
    const mapKey = helpers.getMapkey(position);
    const clientList = await this.returnSessionList("client", position);
    
    if (clientList) {
      const next = {
        clientList, mapKey, response
      };
      resolve(next);
    } else {
      reject();
    }
  })
  .then((next) => {
    // 2. 다음으로 해당 client 리스트 별로 info 정보를 가져옵니다.
    return new Promise((resolve, reject) => {
      Object.keys(next.clientList).forEach(function (key) {
        const idx = next.clientList[key];

        redis.hmget(next.mapKey + "info", idx, (err, result) => {
          if (err) {
            console.log(err);
            reject();
          }
  
          if (result.length > 0) {
            const value = JSON.parse(result[0]);
            const messageLng = next.response.result.position.coordinates[0];
            const messageLat = next.response.result.position.coordinates[1];

            if (value && value !== null) {
              const distance = geolib.getDistance(
                { latitude: value.position[1], longitude: value.position[0] }, // 소켓의 현재 위치 (순서 주의!)
                { latitude: messageLat, longitude: messageLng }                // 메시지 발생 위치
              );
              if (value.radius >= distance) { 
                // 거리 값이 설정한 반경보다 작을 경우에만 이벤트를 보내줍니다.            
                socket.broadcast.to(key).emit(event, next.response);
              }
            }
          }
        });
      });
      socket.emit(event, response); // 자신에게도 전송합니다.
    })
  });
};

/* 
  좌표 값을 주면, 해당 좌표의 타일과 옆 타일의 유저를 찾아 반환하는 함수입니다.
  @param type     : client, info, geo 중 하나
  @param position : 유저를 찾을 기준이 되는 좌표 값
  @param radius   : (type이 geo일 경우) 반경 값
*/
exports.returnSessionList = (type, position, radius) => {
  return new Promise((resolve, reject) => {
    // 먼저 현재 좌표를 이용해 현재 타일과 추가적으로 살펴야 할 타일을 구합니다.
    const lng = position[0];
    const lat = position[1];
    const lngTile = Math.floor(lng * 10);
    const latTile = Math.floor(lat * 10);
    const newLngTile = (lng - Math.floor(lng)) * 10 * 2 > 1 ? lngTile + 1 : lngTile - 1;
    const newLatTile = (lat - Math.floor(lat)) * 10 * 2 > 1 ? latTile + 1 : latTile - 1;

    const selectKeys = [
      lngTile + "-" + latTile + type,       // 기본 키
      lngTile + "-" + newLatTile + type,    // 추가로 찾아야 하는 키 (좌우)
      newLngTile + "-" + latTile + type     // 추가로 찾아야 하는 키 (상하)
    ];

    let resultForHash = {};
    let resultForGeo = [];

    selectKeys.map((key, i) => {
      // 생성한 키 별로 select해, 결과를 합친 다음 결과를 return 합니다.
      if (type === "geo") {   // 타입이 geo일 경우엔 GEO API를 사용합니다.
        redis.georadius(key, lng, lat, radius, "m", (err, positions) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          resultForGeo = resultForGeo.concat(positions);
          resolve(resultForGeo);          
        });
      } else {                // 타입이 client이거나 info일 경우엔 hash 사용      
        redis.hgetall(key, (err, object) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          resultForHash = Object.assign(resultForHash, object);  
          
          if (i === 2) { // 조회가 모두 끝나면 return!
            resolve(resultForHash);
          }
        });
      }
    });
  });
}