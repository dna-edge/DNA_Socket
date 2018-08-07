const env = global.env;

// const db = require('./db').db;
const redis = require('redis').createClient(env.REDIS_PORT, env.REDIS_HOST);
redis.auth(env.REDIS_PASSWORD);

const mysql = require('mysql');

const connection = mysql.createConnection({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME
});

module.exports.db = connection;
module.exports.redis = redis;