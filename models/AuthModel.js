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
          customErr = new Error("Token is expired");
          return done(customErr);
        case 'invalid token':
          customErr = new Error("Token is invalid");
          return done(customErr);
        default:
          return done(err.message);
      }
    } else {
      const userData = {
        id: decoded.id,
        nickname: decoded.nickname,
        avatar: decoded.avatar
      }
      done(null, userData);
    }
  });
};