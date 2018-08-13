const redis = global.utils.redis;

const jwt = require('jsonwebtoken');

/*******************
 *  Authenticate
 *  @param: (Access) token
 ********************/
exports.auth = (token, done) => {
  jwt.verify(token, global.env.JWT_CERT, (err, decoded) => {
    if (err) {
      let customErr = '';

      switch (err.message) {
        case 'jwt expired':
          return done(10400);
        case 'invalid token':
          return done(10411);
        default:
          return done(err.message);
      }
    } else {
      const userData = {
        idx: decoded.idx,
        id: decoded.id,
        nickname: decoded.nickname,
        avatar: decoded.avatar
      }
      done(null, userData);
    }
  });
};