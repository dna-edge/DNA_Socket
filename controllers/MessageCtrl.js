const validator = require('validator');

const messageModel = require('../models/MessageModel');
const helpers = require('../utils/helpers');

let validationError = {
  name:'ValidationError',
  errors:{}
};

/*******************
 *  Save
 *  TODO 저장 이후 처리 (socket emit, PUSH)
 ********************/
exports.save = (token, param) => {
  // 1. 먼저 해당 jwt가 유효한지 확인 
  helpers.returnAuth(token)
  .then((userData) => {
    return new Promise(async (resolve, reject) => {
      /* PARAM */
      const id = userData.id;
      const nickname = userData.nickname;
      const avatar = userData.avatar;
      const lng = param.lng || param.lng;
      const lat = param.lat || param.lat;
      const contents = param.contents || param.contents;

      /* 2. 유효성 체크하기 */
      let isValid = true;

      if (!lng || validator.isEmpty(lng)) {
        isValid = false;
        validationError.errors.lon = { message : "Longitude is required" };
      }

      if (!lat || validator.isEmpty(lat)) {
        isValid = false;
        validationError.errors.lat = { message : "Latitude is required" };
      }

      if (!contents || validator.isEmpty(contents)) {
        isValid = false;
        validationError.errors.contents = { message : "Contents is required" };
      }

      if (!isValid) reject();
      /* 유효성 체크 끝 */

      // 3. DB에 저장하기
      const messageData = {
        id, nickname, avatar, lng, lat, contents
      };

      try {
        await messageModel.save(messageData);
      } catch (error) {
        // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
        return reject(error);
      }

      // 4 등록 성공! 소켓으로 다시 반대로 쏴줘야 한다.
      return resolve(messageData);
    });
  });
};


/*******************
 *  selectOne
 *  
 ********************/
exports.selectOne = async (req, res, next) => {
  /* PARAM */
  const idx = req.body.idx || req.params.idx;

  /* 1. 유효성 체크하기 */
  let isValid = true;

  if (!idx || validator.isEmpty(idx)) {
    isValid = false;
    validationError.errors.idx = { message : "idx is required" };
  }

  if (!isValid) return res.status(400).json(validationError);
  /* 유효성 체크 끝 */

  // 2. DB에서 끌고 오기
  let result = '';
  try {
    result = await messageModel.selectOne(idx);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  // 3. 조회 성공
  const respond = {
    status: 200,
    message : "Selecct Messages Successfully",
    data: result
  };
  return res.status(200).json(respond);
}



/*******************
 *  selectAll
 *  
 ********************/
exports.selectAll = async (req, res, next) => {
  /* PARAM */
  const page = parseInt(req.body.page) || parseInt(req.params.page);
  
  // 1. DB에서 끌고 오기
  let result = '';
  try {
    result = await messageModel.selectAll(page);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  // 2. 조회 성공
  const respond = {
    status: 200,
    message : "Selecct Messages Successfully",
    data: result
  };
  return res.status(200).json(respond);
}


/*******************
 *  SelectCircle
 *  
 ********************/
exports.selectCircle = async (req, res, next) => {
  /* PARAM */
  const lng = req.body.lng || req.query.lng;
  const lat = req.body.lat || req.query.lat;
  const radius = req.body.radius || req.query.radius;

  /* 1. 유효성 체크하기 */
  let isValid = true;

  if (!lng || validator.isEmpty(lng)) {
    isValid = false;
    validationError.errors.lng = { message : "Longitude is required" };
  }

  if (!lat || validator.isEmpty(lat)) {
    isValid = false;
    validationError.errors.lat = { message : "Latitude is required" };
  }

  if (!radius || validator.isEmpty(radius)) {
    isValid = false;
    validationError.errors.radius = { message : "Radius is required" };
  }

  if (!isValid) return res.status(400).json(validationError);
  /* 유효성 체크 끝 */

  // 2. DB에서 끌고 오기
  let result = '';
  try {
    const conditions = {
      lng, lat, radius
    };

    result = await messageModel.selectCircle(conditions);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  // 3. 조회 성공
  const respond = {
    status: 200,
    message : "Selecct Messages Successfully",
    data: result
  };
  return res.status(200).json(respond);
};


exports.testsave = async (req, res, next) => {
  /* PARAM */
  const id = req.userData.id;
  const nickname = req.userData.nickname;
  const avatar = req.userData.avatar;
  const lng = req.body.lng || req.query.lng;
  const lat = req.body.lat || req.query.lat;
  const contents = req.body.contents || req.query.contents;
  
  /* 1. 유효성 체크하기 */
  let isValid = true;

  if (!lng || validator.isEmpty(lng)) {
    isValid = false;
    validationError.errors.lng = { message : "Longitude is required" };
  }

  if (!lat || validator.isEmpty(lat)) {
    isValid = false;
    validationError.errors.lat = { message : "Latitude is required" };
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
      id, nickname, avatar, lng, lat, contents
    };

    result = await messageModel.save(messageData);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  // 3. 저장 성공
  const respond = {
    status: 201,
    message : "Create Message Successfully",
    data: result
  };
  return res.status(201).json(respond);
}