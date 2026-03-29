const express = require("express");
const router = express.Router();
const { getUserChats } = require("../controllers/chatController");
const { isAuthCheck } = require("../middlewares/auth");

router.get("/chat", isAuthCheck, getUserChats);
// router.get("/chat-messages/:chatId", isAuthCheck, getChatMessages);

module.exports = router;
