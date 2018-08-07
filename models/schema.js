const mongoose = require('mongoose');

let Schema = {};

Schema.createSchema = (mongoose) => {
  const messageSchema = mongoose.Schema({
    user: {
      id: { type: String, required: true },
      nickname: { type: String, required: true },
      avatar: String,
    },
    location: {
      type: { type: String, default: "Point"},
      coordinates: [{ type: Number }]
    },
    contents: { type: String, required: true},
    likes: { type: Number, default: 0, index: true},
    created_at : { type : String, index : {unique : false} }
  });

  messageSchema.index({ location: '2dsphere'});

  // selectAll : 전체 조회하기
  messageSchema.static('selectAll', function(callback){
    return this.find({}, callback);
  });

  // selectCircle : 특정 반경 내의 값 조회하기
  messageSchema.static('selectCircle', function(center_longitude, center_latitude, radius, callback){
    this.find().where('geometry').within(
      {
        center : [parseFloat(center_longitude), parseFloat(center_latitude)],
        radius : parseFloat(radius/6371000),
        unique : true, spherical : true
      }
    ).exec(callback);
  });

  return messageSchema;
};

module.exports = Schema;