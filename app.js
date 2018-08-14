const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

require('dotenv').config();
global.utils = require('./utils/global');
require('./routes')(app);
app.get('/message', function(req, res){
  res.sendFile(__dirname + '/test_message.html');
});

app.get('/dm', function(req, res){
  res.sendFile(__dirname + '/test_dm.html');
});

const PORT = 9013;
const http = require('http').Server(app);
const socket = require('./utils/socket').init(http);

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup || exitCode || exitCode === 0) {
      global.utils.redis.del("clients");
    }
    if (options.exit) {
      global.utils.redis.del("clients");
      process.exit();
    }
}

process.on('exit', exitHandler.bind(null,{cleanup:true}));            // do something when app is closing
process.on('SIGINT', exitHandler.bind(null, {exit:true}));            // catches ctrl+c event
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));           // catches "kill pid"
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true})); // uncaught exceptions

http.listen(PORT, () => {
  console.info(`[DNA-SocketApiServer] Listening on Port ${PORT}`);
});

module.exports = app;