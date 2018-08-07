const authCtrl = require('../controllers/AuthCtrl');
const messageCtrl = require('../controllers/MessageCtrl');

module.exports = (router) => {
  router.route('/message')
    .post(authCtrl.auth, messageCtrl.save);

  return router;
};