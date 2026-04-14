const express = require("express");
const router = express.Router();
const {
  getUserChats,
  getOrCreateChat,
  getMessages,
  getGeneratedAiChats,
} = require("../controllers/chatController");
const { isAuthCheck } = require("../middlewares/auth");

// Get all chats (sidebar)
router.get("/chats", isAuthCheck, getUserChats);

// Get or create chat with a user
router.get("/chats/user/:targetUserId", isAuthCheck, getOrCreateChat);

// Get messages of a chat (with pagination)
router.get("/chats/:chatId/messages", isAuthCheck, getMessages);

// Get generated AI chats
router.post("/chats/ai", isAuthCheck, getGeneratedAiChats);

module.exports = router;
