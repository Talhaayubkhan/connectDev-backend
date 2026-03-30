const express = require("express");
const router = express.Router();
const {
  getUserChats,
  getOrCreateChat,
  getMessages,
} = require("../controllers/chatController");

// Get all chats (sidebar)
router.get("/chats", getUserChats);

// Get or create chat with a user
router.get("/user/:targetUserId", getOrCreateChat);

// Get messages of a chat (with pagination)
router.get("/:chatId/messages", getMessages);

module.exports = router;
