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
        return res.status(500).send(error);
    })
});

router.post("/return_public_user", login, (req, res, next) => {
    _usersService.returnUser(req.body.id, false, req.usuario.id).then((results) => {
        let response = functions.createResponse("Retorno do usuário", results, "GET", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
});

router.post("/change_profile_photo", login, uploadConfig.upload.single('user_image'), (req, res, next) => {
    _usersService.changeProfilePhoto(req.usuario.id, req.file.transforms[0].location).then((results) => {
        let response = functions.createResponse("Foto de perfil alterada com sucesso", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
});

router.post("/change_profile_banner", login, uploadConfig.upload.single('user_banner'), (req, res, next) => {
    _usersService.changeProfileBanner(req.usuario.id, req.file.transforms[0].location).then((results) => {
        let response = functions.createResponse("Imagem de fundo alterada com sucesso", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
});

router.post("/return_feed", login, (req, res, next) => {
    _usersService.returnFeed(req.usuario.id, req.body.user_id).then((results) => {
        let response = functions.createResponse("Retorno das publicações do usuário", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/search_users", login, (req, res, next) => {
    _usersService.returnSearchedUsers(req.body.searchString).then((results) => {
        let response = functions.createResponse("Retorno da lista de usuários", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/update_account", login, (req, res, next) => {
    _usersService.changeAccount(req.usuario.id, req.body.nickname, req.body.old_password, req.body.password, req.body.visibility).then((results) => {
        let response = functions.createResponse("Conta alterada com sucesso", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/exclude_account", login, (req, res, next) => {
    _usersService.excludeAccount(req.usuario.id).then((results) => {
        let response = functions.createResponse("Conta excluída com sucesso", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.post("/diary", login, (req, res, next) => {
    _usersService.postDiary(req.usuario.id, req.body.diary_text).then((results) => {
        let response = functions.createResponse("Diário guardado com sucesso", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.get("/diary", login, (req, res, next) => {
    _usersService.returnDiaryPages(req.usuario.id).then((results) => {
        let response = functions.createResponse("Retorno das páginas do diário", results, "GET", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

router.delete("/diary/:post_id/delete_page", login, (req, res, next) => {
    _usersService.deletePage(req.usuario.id, req.params.post_id).then(() => {
        let response = functions.createResponse("Página do diário excluída com sucesso", null, "DELETE", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    })
})

module.exports = router;