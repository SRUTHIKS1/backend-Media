const express = require("express");
const { register, login, getUser, editUser, forgotPassword, resetPassword, createFolder, getFolderList, createBookmark, editBookmark, getBookmarkById, getAllBookmarks, getBookmarksByFolderId, deleteBookmark, renameFolder, deleteFolder } = require("../controller/controller");
const upload = require("../middleware/multerMiddleware");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const router = new express.Router()

router.post('/register', register)
router.post('/login', login)
router.get("/getUserDetails/:userId", getUser);
router.put("/editUserDetails/:userId/",jwtMiddleware,upload.single("img"),editUser);
router.post("/forgotpassword",forgotPassword);
router.post("/resetpassword/:token",resetPassword);
// ✅ Folder routes
router.post("/folders/create", jwtMiddleware,createFolder);
router.get("/folders", jwtMiddleware, getFolderList);
router.post("/bookmarks/create", jwtMiddleware, createBookmark);
router.put("/bookmarks/edit/:bookmarkId", jwtMiddleware, editBookmark);
router.get("/bookmarks/:bookmarkId", jwtMiddleware, getBookmarkById);
router.get("/bookmarks/folder/:folderId", jwtMiddleware, getBookmarksByFolderId);
router.delete("/bookmarks/delete/:bookmarkId", jwtMiddleware, deleteBookmark);
// routes.js
router.put("/folders/rename/:folderId", jwtMiddleware, renameFolder);
router.delete("/folders/delete/:folderId", jwtMiddleware, deleteFolder);








module.exports = router;