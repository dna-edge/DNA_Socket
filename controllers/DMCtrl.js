const validator = require('validator');

const dmModel = require('../models/DMModel');
const roomModel = require('../models/RoomModel');

let validationError = {
  name:'ValidationError',
  errors:{}
};


/*******************
 *  Save
 *  @param: roomIdx, contents
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



/*******************
 *  selectAll
 *  @param: roomIdx, page
 ********************/
exports.selectAll = async (req, res, next) => {
  /* PARAM */
  const userIdx = req.userData.idx;
  const roomIdx = req.body.idx || req.params.idx;
  const page = req.body.page || req.params.page;

  /* 1. 유효성 체크하기 */
  let isValid = true;

  if (!roomIdx || validator.isEmpty(roomIdx)) {
    isValid = false;
    validationError.errors.roomIdx = { message : "Roomidx is required" };
  }

  if (!isValid) return res.status(400).json(validationError);
  /* 유효성 체크 끝 */

  // 2. 해당 유저가 채팅방에 소속되어 있는지 먼저 확인
  let check = '';
  try {
    check = await roomModel.checkUser(userIdx, roomIdx);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  if (!check) {
    return res.status(401).json({
      error:'Unauthorized'
    });
  }
  
  // 2. DB에서 끌고 오기
  let result = '';
  try {
    result = await dmModel.selectAll(roomIdx, page);
  } catch (error) {
    // TODO 에러 잡았을때 응답메세지, 응답코드 수정할것
    return next(error);
  }

  // 3. 조회 성공
  const respond = {
    status: 200,
    message : "Select Direct Messages Successfully",
    data: result
  };
  return res.status(200).json(respond);
}



exports.testsave = async (req, res, next) => {
  /* PARAM */
  const idx = req.userData.idx;
  const roomidx = req.body.room_idx || req.params.room_idx;
  const type = req.body.type || req.params.type;
  const contents = req.body.contents || req.params.contents;
  
  console.log()

  /* 1. 유효성 체크하기 */
  let isValid = true;

  if (!roomidx || validator.isEmpty(roomidx)) {
    isValid = false;
    validationError.errors.roomidx = { message : "Room index is required" };
  }

  if (!contents || validator.isEmpty(contents)) {
    isValid = false;
    validationError.errors.contents = { message : "Direct Message Contents is required" };
  }

  if (!isValid) return res.status(400).json(validationError);
  /* 유효성 체크 끝 */

  // 2. DB에 저장 요청하기
  let result = '';
  try {
    const dmData = {
      idx, roomidx, contents
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
    data: { result }
  };
  return res.status(201).json(respond);
}