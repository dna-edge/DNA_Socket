const validator = require('validator');

const messageModel = require('../models/MessageModel');
const userModel = require('../models/UserModel');
const helpers = require('../utils/helpers');

let validationError = {
  name:'ValidationError',
  errors:{}
};


/*******************
 *  Save
 *  param: lng, lat, type, contents
 *  TODO 저장 이후 처리 (socket emit, PUSH)
 ********************/
exports.save = (token, param) => {
  // 1. 먼저 해당 jwt가 유효한지 확인 
  helpers.returnAuth(token)
  .then((userData) => {
    return new Promise(async (resolve, reject) => {
      /* PARAM */
      const idx = userData.idx;
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
        idx, nickname, avatar, lng, lat, contents
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
 *  param : idx
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
    message : "Select Messages Successfully",
    data: result
  };
  return res.status(200).json(respond);
}



/*******************
 *  selectAll
 *  @param: page
 ********************/
exports.selectAll = async (req, res, next) => {
  /* PARAM */
  const idx = req.userData.idx;
  const page = req.body.page || req.params.page;
  
  // 1. 차단 리스트 끌고 오기
  let blocks = '';
  try {
    blocks = await userModel.selectBlock(idx);
  } catch (err) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(err);
  }

  // 2. DB에서 끌고 오기
  let result = '';
  try {
    result = await messageModel.selectAll(blocks, page);
  } catch (err) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(err);
  }

  // 2. 조회 성공
  const respond = {
    status: 200,
    message : "Select Messages Successfully",
    data: result
  };
  return res.status(200).json(respond);
}


/*******************
 *  selectCircle
 *  @param: lng, lat, radius, page
 ********************/
exports.selectCircle = async (req, res, next) => {
  /* PARAM */
  const idx = req.userData.idx;
  const lng = req.body.lng || req.params.lng;
  const lat = req.body.lat || req.params.lat;
  const radius = req.body.radius || req.params.radius;
  const page = req.body.page || req.params.page;  
  
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

  // 2. 차단 리스트 끌고 오기
  let blocks = '';
  try {
    blocks = await userModel.selectBlock(idx);
  } catch (err) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(err);
  }

  // 3. DB에서 끌고 오기
  let result = '';
  try {
    const conditions = {
      lng, lat, radius
    };

    result = await messageModel.selectCircle(conditions, blocks, page);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  // 4. 조회 성공
  const respond = {
    status: 200,
    message : "Select Messages Successfully",
    data: result
  };
  return res.status(200).json(respond);
};


exports.testsave = async (req, res, next) => {
  /* PARAM */
  const idx = req.userData.idx;
  const id = req.userData.id;
  const nickname = req.userData.nickname;
  const avatar = req.userData.avatar;
  const lng = req.body.lng || req.params.lng;
  const lat = req.body.lat || req.params.lat;
  const type = req.body.type || req.params.type;
  const contents = req.body.contents || req.params.contents;
  
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
      idx, id, nickname, avatar, lng, lat, type, contents
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



/*******************
 *  like
 *  @param: messageIdx
 ********************/
exports.like = async (req, res, next) => {
  const userIdx = req.userData.idx;
  const messageIdx = req.body.idx || req.params.idx;

   /* 1. 유효성 체크하기 */
   let isValid = true;

   if (!messageIdx || validator.isEmpty(messageIdx)) {
     isValid = false;
     validationError.errors.messageIdx = { message : "Message idx is required" };
   }
 
   if (!isValid) return res.status(400).json(validationError);
   /* 유효성 체크 끝 */

  // 2. DB에 저장하기
  let result = '';
  try {
    result = await messageModel.like(userIdx, messageIdx);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  let message = '';

  if (result) {
    message = "Like pushed Successfully";
  } else {
    message = "Like popped Successfully"
  }
  // 3. 저장 성공
  const respond = {
    status: 201,
    message
  };

  return res.status(201).json(respond);
}