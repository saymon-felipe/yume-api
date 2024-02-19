const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const _friendsService = require("../services/friendsService");
const functions = require("../utils/functions");

router.post("/send_request", login, (req, res, next) => {
    _friendsService.requestFriend(req.usuario.id, req.body.user_id).then((results) => {
        let response = functions.createResponse("Pedido de amizade enviado", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        console.log(error)
        return res.status(500).send(error);
    })
})

module.exports = router;