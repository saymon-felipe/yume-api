const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const _friendsService = require("../services/friendsService");
const functions = require("../utils/functions");

router.post("/send_request", login, (req, res, next) => {
    _friendsService.requestFriend(req.usuario.id, req.body.user_id).then(() => {
        let response = functions.createResponse("Pedido de amizade enviado", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/accept_request", login, (req, res, next) => {
    _friendsService.acceptFriendRequest(req.body.requesting_user, req.usuario.id).then(() => {
        let response = functions.createResponse("Pedido de amizade aceito", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/reject_request", login, (req, res, next) => {
    _friendsService.rejectFriendRequest(req.body.requesting_user, req.usuario.id).then(() => {
        let response = functions.createResponse("Pedido de amizade removido", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/unfriend", login, (req, res, next) => {
    _friendsService.unfriend(req.usuario.id, req.body.target_user).then(() => {
        let response = functions.createResponse("Amizade desfeita", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/block", login, (req, res, next) => {
    _friendsService.blockUser(req.usuario.id, req.body.target_user).then(() => {
        let response = functions.createResponse("Usuário bloqueado com sucesso", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/unblock", login, (req, res, next) => {
    _friendsService.unblockUser(req.usuario.id, req.body.target_user).then(() => {
        let response = functions.createResponse("Usuário desbloqueado com sucesso", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

module.exports = router;