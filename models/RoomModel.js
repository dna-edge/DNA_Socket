const mongo = global.utils.mongo;

/*******************
 *  Open
 *  @param: roomData = {
 *            user1 = { id, nickname, avatar },
 *            user2 = { id, nickname, avatar }
 *          }
 ********************/
exports.open = (roomData) => {  
  // 1. 해당 유저들의 대화방이 존재하는지 확인
  return new Promise((resolve, reject) => {  
  })
  .then(() => {
    // 2. idx 최대값 구하기 
    mongo.roomModel.count((err, result) => {
      if (err) {
        const customErr = new Error("Error occrred while Counting Rooms: " + err);
        reject(customErr);        
      } else {
        resolve(result);
      }
    });
  })
  .then((count) => { 
    // 3. model 생성하기
    return new Promise((resolve, reject) => {  
      // const now = moment().format("YYYY-MM-DD HH:mm:ss");
      let idx = 0;
      
      if (count[0]) {
        idx = count[0].idx + 1;
      }

      const room = new mongo.roomModel(
        {
          idx,
          user1: {
            id: roomData.user1.id,
            nickname: roomData.user1.nickname,
            avatar: roomData.user1.avatar
          },
          user2: {
            id: roomData.user2.id,
            nickname: roomData.user2.nickname,
            avatar: roomData.user2.avatar
          },
          contents: []
        }
      );

      // 3. save로 저장
      room.save((err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(null);
        }
      });
    });
  });
}