const mongoose = require('mongoose');

const paginationCount = require('../utils/config').pagination_count;
const dmSchema = global.utils.mongo.dmSchema.obj;

let Schema = {};

Schema.createSchema = (mongoose) => {
  const roomSchema = mongoose.Schema({
    idx: { type: Number, require: true, index: { unique: true } },
    user1: {
      idx: { type: Number, required: true},
      id: { type: String, required: true },
      nickname: { type: String, required: true },
      avatar: String
    },
    user2: {
      idx: { type: Number, required: true},
      id: { type: String, required: true },
      nickname: { type: String, required: true },
      avatar: String
    },
    blind: [ String ],
    messages: [ dmSchema ],
    created_at : { type : Date, index: { unique : false }, default: Date.now },
    updated_at : { type : Date, index: { unique : false }, default: Date.now }
  });


  /*******************
   * 메소드 시작
  ********************/

  // count : idx의 최대값 구하기
  roomSchema.static('count', function(callback) {
    return this.find({}, { idx: 1 }, callback).sort({ "idx": -1 }).limit(1);
  });

  // search : 해당 채팅방이 이미 존재하는지 확인
  roomSchema.static('search', function(Idxuser1, Idxuser2, callback) {
    return this.find({      
      $or: [ 
        { $and: [{ 'user1.idx': Idxser1 }, { 'user2.idx': Idxuser2 }] },
        { $and: [{ 'user1.idx': Idxuser2 }, { 'user2.idx': Idxuser1 }] }
      ]
    }, callback);
  });

  // selectOne : 하나 조회하기
  roomSchema.static('selectOne', function(idx, callback) {
    return this.find({ idx: parseInt(idx) }, callback);
  });

  // selectAll : 전체 조회하기
  roomSchema.static('selectAll', function(userIdx, page, callback) {
    if (!page) { // 페이지 인자가 없음 : 페이지네이션이 되지 않은 경우
      return this.find({
          $or: [{ 'user1.idx': userIdx }, { 'user2.idx': userIdx }]
        }, callback)
        .sort('-updated_at')
    } else {     // 페이지 인자가 있음 : 페이지네이션 적용
      return this.find({
          $or: [{ 'user1.idx': userIdx }, { 'user2.idx': userIdx }]
        }, callback)
        .sort('-updated_at')
        .skip(parseInt(page) * paginationCount)
        .limit(paginationCount);
    }    
  });

  // close : 방 나가기 기능
  roomSchema.static('close', function(userIdx, roomIdx, callback) {
    this.findOne({ idx: parseInt(roomIdx) }, (err, room) => {
      if (err) {
        const customErr = new Error("Error occurred while Selecting Room");
        return customErr;
      }
      if (!room) {
        const customErr = new Error("Room with this Idx does not exist");
        return callback(customErr);
      }
      this.find({ $and: [{ idx: room.idx }, { blind: userIdx }] }, (err, blind) => {
        if (err) {
          const customErr = new Error("Error occurred while Selecting Room's blind list");
          return callback(customErr);
        }        
        if (blind.length > 0) {
          const customErr = new Error("This Idx is already added to the Room's blind list");
          return callback(customErr);
        }
        // Room도 존재하고 해당 유저의 idx도 존재할 경우
        this.findOneAndUpdate(
          { idx: parseInt(roomIdx) },
          { $push: { blind: userIdx } },
          callback
        );
      });
    });
  });

  // saveDM : DM 저장하기
  roomSchema.static('saveDM', function(roomIdx, dmData, callback) {
    this.findOneAndUpdate(
      { idx: parseInt(roomIdx) },
      { $push: { messages: dmData } },
      callback
    );
  });

  // updated : updated_at 현재 시간으로 변경하기
  roomSchema.static('updated', function(roomIdx, callback) {
    this.findOneAndUpdate(
      { idx: parseInt(roomIdx) },
      { updated_at: Date.now() },
      callback
    );
  });

  return roomSchema;
};

module.exports = Schema;