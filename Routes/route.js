const express = require("express");
const { register, login } = require("../controller/controller");

const router = new express.Router()

router.post('/register', register)
router.post('/login', login)


module.exports = router;