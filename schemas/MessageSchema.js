const mongoose = require('mongoose');

const paginationCount = require('../utils/config').pagenation_count;

let Schema = {};

Schema.createSchema = (mongoose) => {
  const messageSchema = mongoose.Schema({
    idx: { type: Number, required: true, index: { unique: true } },
    user: {
      id: { type: String, required: true },
      nickname: { type: String, required: true },
      avatar: String
    },
    location: {
      type: { type: String, default: "Point"},
      coordinates: [{ type: Number }]
    },
    contents: { type: String, required: true },
    type: { type: String, default: "Message" },
    likes: { type: Number, default: 0, index: true },
    created_at : { type : Date, index: { unique : false }, default: Date.now }
  });

  messageSchema.index({ location: '2dsphere'});

  // count : idx의 최대값 구하기
  messageSchema.static('count', function(callback) {
    return this.find({}, { idx: 1 }, callback).sort({ "idx": -1 }).limit(1);
  });

  messageSchema.static('selectOne', function(idx, callback) {
    return this.find({ idx: idx }, callback);
  });

  // selectAll : 전체 조회하기
  messageSchema.static('selectAll', function(page, callback) {
    return this.find({}, callback).sort('-created_at').skip(page).limit(paginationCount);
  });

  // selectCircle : 특정 반경 내의 값 조회하기
  messageSchema.static('selectCircle', function(conditions, callback) {
    /* where 안에 들어가는 이름은 해당 컬럼의 이름임에 주의한다! */
    this.find().where('location').within(
      {
        center : [parseFloat(conditions.lng), parseFloat(conditions.lat)],
        radius : parseFloat(conditions.radius/6371000), // change radian: 1/6371 -> 1km
        unique : true, spherical : true
      }
    ).exec(callback);
  });

  return messageSchema;
};

module.exports = Schema;