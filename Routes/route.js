const express = require("express");
const { register, login, getUser, createAd, editUser } = require("../controller/controller");
const upload = require("../middleware/multerMiddleware");

const router = new express.Router()

router.post('/register', register)
router.post('/login', login)
router.post("/createAd", upload.single("Image"), createAd);
router.get("/getUserDetails/:userId", getUser);
router.put("/editUserDetails/:userId/",upload.single("img"),editUser);
module.exports = router;