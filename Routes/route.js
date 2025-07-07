const express = require("express");
const { register, login, getUser, createAd, editUser } = require("../controller/controller");
const upload = require("../middleware/multerMiddleware");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = new express.Router()

router.post('/register', register)
router.post('/login', login)
router.get("/getUserDetails/:userId", getUser);
router.put("/editUserDetails/:userId/",jwtMiddleware,upload.single("img"),editUser);
module.exports = router;