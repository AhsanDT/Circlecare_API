const express = require("express");
// import { Auth } from '../middleware/user.js';
const appauth = require("../middleware/appauth");
const auth = require("../middleware/auth");
const router = express.Router();

const {
  accessChats,
  fetchAllChats,
  sendFile,
  getMessages,
  createChats,
  getMessagesByUserId,
  // getChatById,
  //   creatGroup,
} = require("../controller/chatSupportCtrl");

router.get("/messagesApp/:id", appauth, getMessages);

router.post("/accessChats", auth, accessChats);
router.post("/sendFile", auth, sendFile);
router.get("/messages/:id", auth, getMessages);
router.get("/all-chats/:id", auth, fetchAllChats);

router.get("/adminChat/:chatId", auth, getMessages);

router.get("/userChat/:chatId", appauth, getMessages);
// getChatById

router.post("/accessChatsApp", appauth, createChats);

router.post("/sendFileApp", appauth, sendFile);

router.get("/userMessage/:id", appauth, getMessagesByUserId);
// router.post('/group', Auth, creatGroup);
// router.patch('/group/rename', Auth, renameGroup);
// router.patch('/groupAdd', Auth, addToGroup);
// router.patch('/groupRemove', Auth, removeFromGroup);
// router.delete('/removeuser', Auth);

module.exports = router;
