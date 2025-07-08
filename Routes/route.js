const express = require("express");
const { register, login, getUser, editUser, forgotPassword, resetPassword } = require("../controller/controller");
const upload = require("../middleware/multerMiddleware");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = new express.Router()

router.post('/register', register)
router.post('/login', login)
router.get("/getUserDetails/:userId", getUser);
router.put("/editUserDetails/:userId/",jwtMiddleware,upload.single("img"),editUser);
router.post("/forgotpassword",forgotPassword);
router.post("/resetpassword/:token",resetPassword);

module.exports = router;