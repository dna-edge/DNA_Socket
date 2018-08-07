const mongo = global.utils.mongo;
const redis = global.utils.redis;

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

/*******************
 *  Save
 *  @param: messageData = {id, nickname, avatar, lat, lon, contents}
 ********************/
exports.save = (messageData) => {
  // 1. idx 최대값 구하기 
  return new Promise((resolve, reject) => {  
    mongo.messageModel.count((err, result) => {
      if (err) {
        const customErr = new Error("Error occrred while selecting All Messages: " + err);
        reject(customErr);        
      } else {
        resolve(result);
      }
    });
  })
  .then((count) => {
    // 2. model 생성하기
    return new Promise((resolve, reject) => {  
      const now = moment().format("YYYY-MM-DD HH:mm:ss");
      const message = new mongo.messageModel(
        {
          idx: count[0].idx + 1,
          user: {
            id: messageData.id,
            nickname: messageData.nickname,
            avatar: messageData.avatar
          },
          location: {
            type: "Point",
            coordinates: [messageData.lng, messageData.lat]
          },
          contents: messageData.contents,
          created_at: now
        }
      );

      // 3. save로 저장
      message.save((err) => {
        if (err) {
          // console.log(err);
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
  });
};


/*******************
 *  SelectOne
 *  @param: idx
 ********************/
exports.selectOne = (idx) => {
  return new Promise((resolve, reject) => {      
    // DB의 모델에서 바로 끌고 오면 된다.
    mongo.messageModel.selectOne(idx, (err, result) => {
        if (err) {
          const customErr = new Error("Error occrred while selecting All Messages: " + err);
          reject(customErr);        
        } else {
          resolve(result);
        }
    });
  });
};


/*******************
 *  SelectAll
 *  @param: conditions = {lng, lat, radius}
 ********************/
exports.selectAll = (conditions) => {
  return new Promise((resolve, reject) => {      
    // DB의 모델에서 바로 끌고 오면 된다.
    mongo.messageModel.selectAll((err, result) => {
        if (err) {
          const customErr = new Error("Error occrred while selecting All Messages: " + err);
          reject(customErr);        
        } else {
          resolve(result);
        }
    });
  });
};


/*******************
 *  SelectCircle
 *  @param: conditions = {lng, lat, radius}
 ********************/
exports.selectCircle = (conditions) => {
  return new Promise((resolve, reject) => {      
    // DB의 모델에서 바로 끌고 오면 된다.
    mongo.messageModel.selectCircle(
      conditions, (err, result) => {
        if (err) {
          const customErr = new Error("Error occrred while selecting Messages: " + err);
          reject(customErr);        
        } else {
          resolve(result);
        }
    });
  });
};