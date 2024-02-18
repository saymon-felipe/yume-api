const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const uploadConfig = require('../config/upload');
const _usersService = require("../services/usersService");
const functions = require("../utils/functions");

router.post("/register", (req, res, next) => {
    _usersService.register(req.body.email, req.body.nickname, req.body.password).then((results) => {
        let response = functions.createResponse("Usuário criado com sucesso", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
});

router.post("/login", (req, res, next) => {
    _usersService.login(req.body.email, req.body.password).then((results) => {
        let returnObj = {
            jwtToken: results
        }
        let response = functions.createResponse("Usuario autenticado com sucesso", returnObj, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
});

router.post("/check_jwt", (req, res, next) => {
    _usersService.checkJwt(req.body.token).then((results) => {
        let returnObj = {
            newToken: results
        }
        let response = functions.createResponse("Token válido e foi renovado", returnObj, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
});

router.get("/return_user", login, (req, res, next) => {
    _usersService.returnUser(req.usuario.id).then((results) => {
        let response = functions.createResponse("Retorno do usuário", results, "GET", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        console.log(error)
        return res.status(500).send(error);
    })
});

router.post("/return_public_user", login, (req, res, next) => {
    _usersService.returnUser(req.body.id, false).then((results) => {
        let response = functions.createResponse("Retorno do usuário", results, "GET", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
});

function logoutUsers() {
    functions.executeSql(`
        UPDATE
            users
        SET
            user_status = "offline"
        WHERE
            last_update <= DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 60 second)
    `, [])
    .then((results) => {
        setTimeout(logoutUsers, 20 * 1000);
    })
    .catch((error) => {
        console.log("Error in desconnect users. Error: " + error);
    }).then((results) => {
        setTimeout(logoutUsers, 20 * 1000);
    })
}

setTimeout(() => {
    logoutUsers();
}, 100);

module.exports = router;