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

const PORT = 9014;
app.listen(PORT, () => {
  console.info(`[DNA-SocketApiServer] Listening on Port ${PORT}`);
});

module.exports = app;