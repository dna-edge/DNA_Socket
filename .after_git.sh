git pull origin master

npm install

pm2 del SocketServer

pm2 start npm -- run-script deploy

pm2 restart npm --name SocketServer

