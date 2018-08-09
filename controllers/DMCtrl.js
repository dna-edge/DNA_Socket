const validator = require('validator');

const dmModel = require('../models/DMModel');

let validationError = {
  name:'ValidationError',
  errors:{}
};


/*******************
 *  Save
 *  TODO 저장 이후 처리 (socket emit, PUSH)
 ********************/
exports.save = (req, res, next) => {
  const token = req.headers.token;
  // 1. 먼저 해당 jwt가 유효한지 확인
  returnAuth(token)
  .then((userData) => {
    console.log(1);
  });
}



exports.testsave = async (req, res, next) => {
  /* PARAM */
  const id = req.userData.id;
  const nickname = req.userData.nickname;
  const avatar = req.userData.avatar;
  const roomidx = req.body.roomidx || req.query.roomidx;
  const contents = req.body.contents || req.query.contents;

  /* 1. 유효성 체크하기 */
  if (!roomidx || validator.isEmpty(roomidx)) {
    isValid = false;
    validationError.errors.roomidx = { message : "Room index is required" };
  }

  if (!contents || validator.isEmpty(contents)) {
    isValid = false;
    validationError.errors.contents = { message : "Contents is required" };
  }

  if (!isValid) return res.status(400).json(validationError);
  /* 유효성 체크 끝 */

  // 2. DB에 저장 요청하기
  let result = '';
  try {
    const dmData = {
      id, nickname, avatar, roomidx, contents
    };

    result = await dmModel.save(dmData);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  // 3. 저장 성공
  const respond = {
    status: 201,
    message : "Create Direct Message Successfully",
    data: result
  };
  return res.status(201).json(respond);
}