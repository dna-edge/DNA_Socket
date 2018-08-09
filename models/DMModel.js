const mongo = global.utils.mongo;

/*******************
 *  Save
 *  @param: dmData = {id, nickname, avatar, roomidx, contents}
 ********************/
exports.save = (dmData) => {
  // 1. roomidx 값으로 room 값 찾아오기 (없으면 전송 불가)
  return new Promise((resolve, reject) => {
    mongo.roomModel.selectOne((err, result) => {
      if (err) {
        const customErr = new Error("Error occrred while selecting Room: " + err);
        reject(customErr);  
      } else {
        if (result.length > 0) {
          resolve(result);
        } else { // 해당 idx의 room이 없다.
          const customErr = new Error("There is no chat room for that index.");
          reject(customErr);
        }        
      }
    });
  })
  .then((roomData) => {
    // 2. model 생성하기
    return new Promise((resolve, reject) => {
      // const db = new mongo.
    })
  });
}