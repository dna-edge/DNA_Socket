exports.code =
{
  // Auth Api 관련 에러 코드
  // auth
  10400 : {
    status: 400,
    message: "Token is expired",
    data: ''
  },
  10411 : {
    status: 400,
    message: "Token is invalid",
    data: ''
  },

  // refresh 
  10412 : {
    status: 400,
    message: "Token is expired or invalid",
    data: ''
  },


  // User Api 관련 에러 코드
  // select
  20400 : {
    status: 400,
    message: "User with this Idx does not exist",
    data: ''
  },

  // register
  21400 : {
    status: 400,
    message: "This ID already exists",
    data: ''
  },
  22500 : {
    status: 500,
    message: "Error occurred while saving the user data into DB",
    data: ''
  },

  // login
  23400 : {
    status: 400,
    message: "This ID does not exist",
    data: ''
  },
  24400 : {
    status: 400,
    message: "Wrong Password",
    data: ''
  },
  25400 : {
    status: 400,
    message: "User with this ID does not exist",
    data: ''
  },
  26500: {
    status: 500,
    message: "Error occurred while saving the token into Redis",
    data: ''
  },

  // update
  27400: {
    status: 400,
    message: "Passwords do not match",
    data: ''
  }
};