require('dotenv');
const http = require('http');
const app = require('./app');
const port = process.env.PORT || 3000;
const server = http.createServer(app);
const { initWebSocket } = require('./websocket/websocket');

initWebSocket(server);

server.listen(port);