const validator = require('validator');

const authModel = require('../models/AuthModel');

let tokenError = {
  name:'tokenError',
  errors:{}
};

/*******************
 *  Authenticate
 ********************/
exports.auth = (req, res, next) => {
  if (!req.headers.token) {
    tokenError.errors = { message : 'Access Token is required' };
    return res.status(400).json(tokenError);
  } else {
    authModel.auth(req.headers.token, (err, userData) => {
      if (err) {
        return next(err);
      } else {
        req.userData = userData;
        // return next();

        const respond = {
          status: 202,
          message: "Authenticate Successfully", 
          data: userData
        };
        return next();
      }
    });
  }
};