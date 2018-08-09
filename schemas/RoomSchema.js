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
    contents: [ dmSchema ],
    created_at : { type : Date, index: { unique : false }, default: Date.now }
  });

  roomSchema.static('count', function(callback) {
    return this.find({}, { idx: 1 }, callback).sort({ "idx": -1 }).limit(1);
  });

  roomSchema.static('selectOne', function(idx, callback) {
    return this.find({ idx: idx }, callback);
  });

  roomSchema.static('selectAll', function(page, callback) {
    return this.find({}, callback).sort('-created_at').skip(page).limit(paginationCount);
  });

  return roomSchema;
};

module.exports = Schema;