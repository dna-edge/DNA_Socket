const env = global.env;
const config = require('../utils/config');

/* redis */
const redis = require('redis').createClient(env.REDIS_PORT, env.EC2_HOST);
redis.auth(env.DB_PASSWORD);

/* mysql */
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME
});

/* mongodb */
const mongoose = require('mongoose');

const url = `mongodb://${env.EC2_HOST}:${env.MONGO_PORT}/${env.DB_NAME}`;
const options = {
  user: env.DB_USER,
  pass: env.DB_PASSWORD,
  useNewUrlParser: true,
  promiseLibrary: global.Promise
};
mongoose.connect(url, options);

const mongo = {};
mongo.db = mongoose.connection;
mongo.db.on('error', console.error);
mongo.db.once('open', function(){
  console.log("... Connected to mongod server");
  createSchema(config); // utils/config에 등록된 스키마 및 모델 객체 생성
});
mongo.db.on('disconnected', function(){
  console.log("... Disconnected to mongod server");
});

// config에 정의한 스키마 및 모델 객체 생성
function createSchema(config){
  const schemaLen = config.db_schemas.length;

  for (let i = 0; i < schemaLen; i++){
    let curItem = config.db_schemas[i];

    // 모듈 파일에서 모듈을 불러온 후 createSchema() 함수 호출!
    let curSchema = require(curItem.file).createSchema(mongoose);

    // User 모델 정의
    let curModel = mongoose.model(curItem.collection, curSchema);

    // database 객체에 속성으로 추가
    mongo[curItem.schemaName] = curSchema;
    mongo[curItem.modelName] = curModel;
    console.log("... [%s], [%s] is added to mongo Object.",
                 curItem.schemaName, curItem.modelName);
  }
};

module.exports.mysql = connection;
module.exports.redis = redis;
module.exports.mongo = mongo;