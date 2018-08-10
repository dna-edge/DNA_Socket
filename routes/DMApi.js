const authCtrl = require('../controllers/AuthCtrl');
const roomCtrl = require('../controllers/RoomCtrl');
const dmCtrl = require('../controllers/DMCtrl');

module.exports = (router) => {
  /* 채팅방 조회, 생성, 삭제 */
  router.route('/room/:page')
    .get(authCtrl.auth, roomCtrl.selectAll)

  router.route('/room')
    .get(authCtrl.auth, roomCtrl.selectAll)
    .post(authCtrl.auth, roomCtrl.open)
    .delete(authCtrl.auth, roomCtrl.delete);

  /* 메시지 생성 테스트용 */
  router.route('/dm/test')
    .post(authCtrl.auth, dmCtrl.testsave);

  return router;
};