const authCtrl = require('../controllers/AuthCtrl');
const roomCtrl = require('../controllers/RoomCtrl');
const dmCtrl = require('../controllers/DMCtrl');

module.exports = (router) => {
  /* 채팅방 생성 */
  router.route('/room')
    .post(authCtrl.auth, roomCtrl.open);

  /* 메시지 생성 테스트용 */
  router.route('/dm/test')
    .post(authCtrl.auth, dmCtrl.testsave);

  return router;
};