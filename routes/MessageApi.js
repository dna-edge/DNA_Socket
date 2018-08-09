const authCtrl = require('../controllers/AuthCtrl');
const messageCtrl = require('../controllers/MessageCtrl');

module.exports = (router) => {
  /* 메시지 생성 테스트용 */
  router.route('/message/test')
    .post(authCtrl.auth, messageCtrl.testsave)
  
  /* 특정 메시지 세부 내용 조회 */
  router.route('/message/:idx')
    .get(authCtrl.auth, messageCtrl.selectOne);
  
  /* 특정 반경 내의 메시지 리스트 조회 */
  router.route('/message')
    .post(authCtrl.auth, messageCtrl.selectCircle);

  /* 모든 메시지 리스트 조회 */
  router.route('/messages')
    .get(authCtrl.auth, messageCtrl.selectAll);

  router.route('/messages/:page')
    .get(authCtrl.auth, messageCtrl.selectAll);

  return router;
};