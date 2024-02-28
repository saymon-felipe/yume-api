const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const uploadConfig = require('../config/upload');
const _postsService = require("../services/postsService");
const functions = require("../utils/functions");

router.post("/make_post", login, uploadConfig.upload.single('post_image'), (req, res, next) => {
    _postsService.makePost(req.usuario.id, req.body.post_text, req.file != undefined ? req.file.transforms[0].location : "").then((results) => {
        let response = functions.createResponse("Post feito com sucesso", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
});

router.get("/return_feed", login, (req, res, next) => {
    const offset = req.query.offset || 0;
    const limite = req.query.limite || 20;

    _postsService.returnFeed(req.usuario.id, offset, limite).then((results) => {
        let response = functions.createResponse("Retorno do feed", results, "GET", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.get("/:post_id/return_post", login, (req, res, next) => {
    _postsService.returnPost(req.params.post_id, req.usuario.id).then((results) => {
        let response = functions.createResponse("Retorno do post", results, "GET", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/:post_id/like", login, (req, res, next) => {
    _postsService.likePost(req.usuario.id, req.params.post_id).then(() => {
        let response = functions.createResponse("Post curtido com sucesso", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/:post_id/share", login, (req, res, next) => {
    _postsService.sharePost(req.usuario.id, req.params.post_id, req.body.profile_photo, req.body.nickname, req.body.create_date, req.body.post_text, req.body.post_image, req.body.new_text, req.body.reference_user_id).then((results) => {
        let response = functions.createResponse("Post compartilhado com sucesso", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

module.exports = router;