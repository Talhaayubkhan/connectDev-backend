const express = require("express");
const router = express.Router();
const {
  getUserChats,
  getOrCreateChat,
  getMessages,
} = require("../controllers/chatController");
const { isAuthCheck } = require("../middlewares/auth");

// Get all chats (sidebar)
router.get("/chats", isAuthCheck, getUserChats);

// Get or create chat with a user
router.get("/chats/user/:targetUserId", isAuthCheck, getOrCreateChat);

// Get messages of a chat (with pagination)
router.get("/chats/:chatId/messages", isAuthCheck, getMessages);

module.exports = router;
