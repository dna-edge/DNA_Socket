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

global.env = require('./env');
global.utils = require('./utils/global');
require('./routes')(app);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/test.html');
});

const PORT = 9014;
const http = require('http').Server(app);
const socket = require('./utils/socket').init(http);
// io.on('connection', function(socket){
//   console.log('a user connected');
//   socket.broadcast.emit('hi');

//   socket.on('disconnect', function(){
//     console.log('user disconnected');
//     socket.broadcast.emit('bye');
//   });

//   socket.on('chat message', function(msg){
//     console.log('message: ' + msg);
//     io.emit('chat message', msg);
//   });
// });

http.listen(PORT, () => {
  console.info(`[DNA-SocketApiServer] Listening on Port ${PORT}`);
});

module.exports = app;