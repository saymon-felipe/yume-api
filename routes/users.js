const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const uploadConfig = require('../config/upload');
const _usersService = require("../services/usersService");
const functions = require("../utils/functions");



module.exports = router;