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
  return new Promise((resolve, reject) => {  
    // 1. 모델 인스턴스 생성
    const now = moment().format("YYYY-MM-DD HH:mm:ss");

    const message = new mongo.messageModel(
      {
        user: {
          id: messageData.id,
          nickname: messageData.nickname,
          avatar: messageData.avatar
        },
        location: {
          type: "Point",
          coordinates: [messageData.lon, messageData.lat]
        },
        contents: messageData.contents,
        created_at: now
      }
    );

    // 2. save로 저장
    message.save((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  });
};