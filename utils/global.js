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
  console.log("Connected to mongod server");
  createSchema(config); // utils/config에 등록된 스키마 및 모델 객체 생성
});
mongo.db.on('disconnected', function(){
  console.log("Disconnected to mongod server");
});

// config에 정의한 스키마 및 모델 객체 생성
function createSchema(config){
  const schemaLen = config.db_schemas.length;
  console.log("config에 정의된 스키마의 수 : %d", schemaLen);

  for (let i = 0; i < schemaLen; i++){
    let curItem = config.db_schemas[i];

    // 모듈 파일에서 모듈을 불러온 후 createSchema() 함수 호출!
    let curSchema = require(curItem.file).createSchema(mongoose);
    console.log("%s 모듈을 불러온 후 스키마를 정의합니다.", curItem.file);

    // User 모델 정의
    let curModel = mongoose.model(curItem.collection, curSchema);
    console.log("%s 컬렉션을 위해 모델을 정의합니다", curItem.collection);

    // database 객체에 속성으로 추가
    mongo[curItem.schemaName] = curSchema;
    mongo[curItem.modelName] = curModel;
    console.log("스키마 이름 [%s], 모델 이름 [%s]이 mongo 객체의 속성으로 추가되었습니다.",
                 curItem.schemaName, curItem.modelName);
  }
};

module.exports.db = connection;
module.exports.redis = redis;
module.exports.mongo = mongo;