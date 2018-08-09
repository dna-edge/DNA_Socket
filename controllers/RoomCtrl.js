const validator = require('validator');

const roomModel = require('../models/RoomModel');

let validationError = {
  name:'ValidationError',
  errors:{}
};


/*******************
 *  Open
 *  @param user1, user2
 ********************/
exports.open = async (req, res, next) => {
  /* PARAM */
  const user1 = req.userData;
  const user2 = {
    id: req.body.id || req.query.id,
    nickname: req.body.nickname || req.query.nickname,
    avatar: req.body.avatar || req.query.avatar
  };

  /* 1. 유효성 체크하기 */
  let isValid = true;

  if (!user2.id || validator.isEmpty(user2.id)) {
    isValid = false;
    validationError.errors.id = { message : "Id is required" };
  }

  if (!user2.nickname || validator.isEmpty(user2.nickname)) {
    isValid = false;
    validationError.errors.nickname = { message : "Nickname is required" };
  }

  if (!isValid) return res.status(400).json(validationError);
  /* 유효성 체크 끝 */

  // 2. DB에 저장하기
  let result = '';
  try {
    const roomData = {
      user1, user2
    };

    result = await roomModel.open(roomData);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  // 3. 저장 성공
  const respond = {
    status: 201,
    message : "Create Direct Mesesage Room Successfully",
    data: result
  };
  return res.status(201).json(respond);
}

exports.selectAll = async (req, res, next) => {
  
}