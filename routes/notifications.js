const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const _notificationsService = require("../services/notificationsService");
const functions = require("../utils/functions");

router.get("/", login, (req, res, next) => {
    _notificationsService.getNotifications(req.usuario.id).then((results) => {
        let response = functions.createResponse("Retorno das notificações do usuário", results, "GET", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        console.log(error)
        return res.status(500).send(error);
    })
})

module.exports = router;