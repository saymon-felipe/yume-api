const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const _chatService = require("../services/chatService");
const functions = require("../utils/functions");

router.get("/return_users", login, (req, res, next) => {
    _chatService.returnUsers(req.usuario.id).then((results) => {
        let response = functions.createResponse("Retorno da lista de amigos", results, "GET", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/send_message", login, (req, res, next) => {
    _chatService.isFriends(req.usuario.id, req.body.receiver_id).then(() => {
        _chatService.sendMessage(req.usuario.id, req.body.receiver_id, req.usuario.nickname, req.body.sender_profile_photo, req.body.receiver_name, req.body.message).then(() => {
            let response = functions.createResponse("Mensagem enviada com sucesso", null, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        })
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/return_messages", login, (req, res, next) => {
    _chatService.isFriends(req.usuario.id, req.body.destiny_user_id).then(() => {
        _chatService.returnMessages(req.usuario.id, req.body.destiny_user_id).then((results) => {
            let response = functions.createResponse("Retorno das mensagens de chat", results, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        })
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/view_messages", login, (req, res, next) => {
    _chatService.isFriends(req.usuario.id, req.body.destiny_user_id).then(() => {
        _chatService.viewMessages(req.body.destiny_user_id, req.usuario.id).then(() => {
            let response = functions.createResponse("Visualizar todas as mensagens", null, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        })
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/check_new_messages", login, (req, res, next) => {
    _chatService.isFriends(req.usuario.id, req.body.destiny_user_id).then(() => {
        _chatService.checkNewMessages(req.body.destiny_user_id, req.usuario.id).then((results) => {
            let response = functions.createResponse("Verificando se existem mensagens não lidas", results, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        })
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/check_viewed_messages", login, (req, res, next) => {
    _chatService.isFriends(req.usuario.id, req.body.destiny_user_id).then(() => {
        _chatService.checkViewedMessages(req.usuario.id, req.body.destiny_user_id).then((results) => {
            let response = functions.createResponse("Verificando se as mensagens já foram lidas", results, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        })
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

module.exports = router;