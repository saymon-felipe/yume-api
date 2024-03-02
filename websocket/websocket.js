const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { isFriends, sendMessage, viewMessages } = require('../services/chatService');
const { updateOnline } = require("../services/usersService");
const { requestFriend } = require("../services/friendsService");
const { likePost } = require("../services/postsService");
const { viewNotifications } = require("../services/notificationsService");

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  const userConnections = new Map();
  const userMessages = new Map();

  wss.on('connection', function connection(ws, req) {
    let userId;

    try {
        const token = decodeURI(req.url).split('token=')[1];
        const decode = jwt.verify(token, process.env.JWT_KEY);
        const connected = decode;

        userId = connected.id;

        userConnections.set(userId, ws);

        updateUserStatus(userId, 1);

        // Evento de mensagem recebida
        ws.on('message', function incoming(message) {
            message = JSON.parse(message);
            
            if (message.sender_id == userId) {
                isFriends(userId, message.receiver_id).then(() => {
                    const receiverSocket = userConnections.get(message.receiver_id);

                    if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
                        if (!userMessages.has(message.receiver_id)) {
                            userMessages.set(message.receiver_id, []);
                        }

                        userMessages.get(message.receiver_id).push(message);
                        receiverSocket.send(JSON.stringify(message));
                    } 

                    sendMessage(message.sender_id, message.receiver_id, message.sender_name, message.sender_profile_photo, message.receiver_name, message.message); // Salvar a mensagem no banco de dados ou estrutura de armazenamento
                })
            }

            if (message.type == 'message_viewed') {
                const senderId = message.senderId;

                if (message.senderId == userId) {
                    updateMessageStatus(senderId);
                }
            
                // Enviar uma notificação para o remetente de que a mensagem foi visualizada
                const senderSocket = userConnections.get(senderId);
                if (senderSocket) {
                    senderSocket.send(JSON.stringify({ type: 'message_viewed', senderId: senderId }));
                }
            }

            if (message.type == 'message_viewed' && message.senderId == userId) {
                const senderId = message.senderId;

                const senderSocket = userConnections.get(senderId);
                if (senderSocket) {
                    senderSocket.send(JSON.stringify({ type: 'message_viewed', senderId: senderId }));
                }
            }

            if (message.type == 'online') {
                message.friends.forEach(friend => {
                    let friendSocket = userConnections.get(parseInt(friend));
                    if (friendSocket) {
                        friendSocket.send(JSON.stringify({ type: 'online_friend', friend: userId }));
                    }
                })
            }

            if (message.type == 'offline') {
                message.friends.forEach(friend => {
                    let friendSocket = userConnections.get(parseInt(friend));
                    if (friendSocket) {
                        friendSocket.send(JSON.stringify({ type: 'offline_friend', friend: userId }));
                    }
                })
            }

            if (message.type == 'friend_request') {
                let targetSocket = userConnections.get(parseInt(message.user_id));

                requestFriend(userId, message.user_id).then(() => {
                    if (targetSocket) {
                        targetSocket.send(JSON.stringify({ type: 'reload_notifications' }));
                    }
                });
            } 

            if (message.type == "post_like") {
                let targetSocket = userConnections.get(parseInt(message.user_id));

                likePost(userId, message.post_id).then(() => {
                    if (targetSocket) {
                        targetSocket.send(JSON.stringify({ type: 'reload_notifications' }));
                    }
                })
            }

            if (message.type == "reload_system") {
                let mySocket = userConnections.get(userId);

                if (mySocket) {
                    mySocket.send(JSON.stringify({ type: 'reload_system' }));
                }
            }

            if (message.type == "view_notifications") {
                viewNotifications(userId);
            }
        });
    } catch (error) {
        ws.close();
    }
  
    // Evento de fechamento da conexão
    ws.on('close', function close() {
        if (userMessages.has(userId)) {
            userMessages.delete(userId);
        }

        userConnections.delete(userId);

        updateUserStatus(userId, 0);
    });

    function updateMessageStatus(senderId) {        
        let messages = userMessages.get(senderId);

        messages.forEach((item) => {
            item.view_date = getCurrentDateTime();
        })

        viewMessages(senderId, userId);
    }

    function updateUserStatus(user_id, online = 0) {
        updateOnline(online, user_id);
    }

  });
}

function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário
    const day = String(now.getDate()).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário
    const hours = String(now.getHours()).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário
    const seconds = String(now.getSeconds()).padStart(2, '0'); // Adiciona um zero à esquerda se for necessário

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = { initWebSocket };