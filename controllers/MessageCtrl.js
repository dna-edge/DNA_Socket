const validator = require('validator');

const messageModel = require('../models/MessageModel');

let validationError = {
  name:'ValidationError',
  errors:{}
};

/*******************
 *  Create
 *  TODO validation
 ********************/
exports.save = async (req, res, next) => {
  /* PARAM */
  const id = req.userData.id;
  const nickname = req.userData.nickname;
  const avatar = req.userData.avatar;
  const lat = req.body.lat || req.query.lat;
  const lon = req.body.lon || req.query.lon;
  const contents = req.body.contents || req.query.contents;
  
  /* 1. 유효성 체크하기 */
  let isValid = true;

  if (!lat || validator.isEmpty(lat)) {
    isValid = false;
    validationError.errors.lat = { message : "Latitude is required" };
  }

  if (!lon || validator.isEmpty(lon)) {
    isValid = false;
    validationError.errors.lon = { message : "Longitude is required" };
  }

  if (!contents || validator.isEmpty(contents)) {
    isValid = false;
    validationError.errors.contents = { message : "Contents is required" };
  }

  if (!isValid) return res.status(400).json(validationError);
  /* 유효성 체크 끝 */

  // 2. DB에 저장하기
  let result = '';
  try {
    const messageData = {
      id, nickname, avatar, lat, lon, contents
    };

    result = await messageModel.save(messageData);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  // 3. 등록 성공
  const respond = {
    status: 201,
    message : "Create Message Successfully",
    data: result
  };
  return res.status(201).json(respond);
}