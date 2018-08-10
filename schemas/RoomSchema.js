const mongoose = require('mongoose');

const paginationCount = require('../utils/config').pagenation_count;
const dmSchema = global.utils.mongo.dmSchema.obj;

let Schema = {};

Schema.createSchema = (mongoose) => {
  const roomSchema = mongoose.Schema({
    idx: { type: Number, require: true, index: { unique: true } },
    user1: {
      id: { type: String, required: true },
      nickname: { type: String, required: true },
      avatar: String
    },
    user2: {
      id: { type: String, required: true },
      nickname: { type: String, required: true },
      avatar: String
    },
    blind: [ String ],
    contents: [ dmSchema ],
    created_at : { type : Date, index: { unique : false }, default: Date.now },
    created_at : { type : Date, index: { unique : false }, default: Date.now }
  });

  roomSchema.static('count', function(callback) {
    return this.find({}, { idx: 1 }, callback).sort({ "idx": -1 }).limit(1);
  });

  roomSchema.static('search', function(IDuser1, IDuser2, callback) {
    return this.find({      
      $or: [ 
        { $and: [{ 'user1.id': IDuser1 }, { 'user2.id': IDuser2 }] },
        { $and: [{ 'user1.id': IDuser2 }, { 'user2.id': IDuser1 }] }
      ]
    }, callback);
  })

  roomSchema.static('selectOne', function(idx, callback) {
    return this.find({ idx }, callback);
  });

  roomSchema.static('selectAll', function(userId, page, callback) {
    return this.find({
      $or: [{ 'user1.id': userId }, { 'user2.id': userId }]      
    }, callback).sort('-updated_at').skip(page).limit(paginationCount);
  });

  roomSchema.static('delete', function(userId, roomIdx, callback) {
    this.findOne({ idx: roomIdx }, (err, room) => {
      if (err) {
        const customErr = new Error("Error occurred while Selecting Room");
        return customErr;
      }
      if (!room) {
        const customErr = new Error("Room with this Idx does not exist");
        return callback(customErr);
      }
      this.find({ blind: userId }, (err, blind) => {
        if (err) {
          const customErr = new Error("Error occurred while Selecting Room's blind list");
          return callback(customErr);
        }        
        if (blind.length > 0) {
          const customErr = new Error("This ID is already added to the Room's blind list");
          return callback(customErr);
        }
        // Room도 존재하고 해당 유저의 idx도 존재할 경우
        this.findOneAndUpdate({ idx: roomIdx },
          { $push: { blind: userId } },
          callback
        );
      });
    })
  });

  return roomSchema;
};

module.exports = Schema;