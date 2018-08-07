const messageCtrl = require('../controllers/MessageCtrl');
const authCtrl = require('../controllers/AuthCtrl');
const helpers = require('./helpers');

let socket = {};

socket.io = null;
socket.clients = [];

socket.init = (http) => {
  io = require('socket.io')(http);

  // 웹 소켓 연결
  io.on('connection', (client) => {
    console.log('a user connected');
    // 일단 현재 서버에 클라이언트의 정보를 저장한다.
    client.on('store_client_info', (data) => {
      // customID가 현재 서버에 저장되어 있지 않으면 새로 발급받는다.
      if (helpers.getClientId(data.customId) === -1) {
        let clientInfo = {
          customId: data.customId,
          clientId: client.id
        };
        socket.clients.push(clientInfo);
      }
    });

    // 새로 메시지를 생성했을 경우에는
    client.on('save_message', async (token, messageData) => {   
      // 1. DB에 저장하기 위해 컨트롤러를 호출한다.
      const data = await messageCtrl.save(token, messageData);

      // 2. 저장한 결과값을 연결된 소켓에 쏴준다.
      io.emit('new_message', data);
    });

    // 클라이언트가 연결을 종료하면 리스트에서 제외한다.
    client.on('disconnect', function (data) {
      console.log('user disconnected');
      // for(let i=0, len=clients.length; i<len; ++i) {
      //   let c = clients[i];

      //   if(c.clientId === client.id) {
      //     clients.splice(i,1);
      //     break;
      //   }
      // }
      // sub.quit();
    });
  });
};

module.exports = socket;