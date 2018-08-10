const mongo = global.utils.mongo;

/*******************
 *  Open
 *  @param: roomData = {
 *            user1 = { id, nickname, avatar },
 *            user2 = { id, nickname, avatar }
 *          }
 ********************/
exports.open = (roomData) => {  
  // 1. 해당 유저들의 채팅방이 존재하는지 확인
  return new Promise((resolve, reject) => {
    mongo.roomModel.search(roomData.user1.id, roomData.user2.id, (err, result) => {
      if (err) {
        const customErr = new Error("Error occrred while finding Room: " + err);
        reject(customErr);        
      } else {
        if (result.length === 0) { // 채팅방이 존재하지 않는다!
          resolve(null);
        } else {
          const customErr = new Error("The room already exists: " + err);
          reject(customErr);    
        }        
      }
    });
  })
  .then(() => {
    // 2. idx 최대값 구하기 
    return new Promise((resolve, reject) => {  
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
        let idx = 1;
        
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
            blind: [],
            contents: []
          }
        );

        // 3. save로 저장
        room.save((err) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(room);
          }
        });
      });
    });
  });
}


/*******************
 *  SelectAll
 *  @param: userId, page
 ********************/
exports.selectAll = (userId, page) => {
  return new Promise((resolve, reject) => { 
    // DB의 모델에서 바로 끌고 오면 된다.
    mongo.roomModel.selectAll(userId, page, (err, result) => {
        if (err) {
          const customErr = new Error("Error occrred while selecting All Rooms: " + err);
          reject(customErr);        
        } else {
          resolve(result);
        }
    });
  });
};


/*******************
 *  Delete
 *  @param: userId, roomIdx
 ********************/
exports.delete = (userId, roomIdx) => {
  return new Promise((resolve, reject) => { 
    // DB의 모델에서 바로 끌고 오면 된다.
    mongo.roomModel.delete(userId, roomIdx, (err, result) => {
        if (err) {
          const customErr = new Error("Error occrred while Removing Room's DMs: " + err);
          reject(customErr);        
        } else {
          resolve(result);
        }
    });
  });
};
