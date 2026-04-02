// controllers/chatController.js

const {
  getUserChatsService,
  getOrCreateChatService,
  getMessagesService,
} = require("../services/chatServices");

// 1. Sidebar chats
const getUserChats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const chats = await getUserChatsService(userId);

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Open chat (create if not exists)
const getOrCreateChat = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    const result = await getOrCreateChatService(userId, targetUserId);

    res.status(200).json({
      success: true,
      data: result, // { chat, messages }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Pagination
const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const messages = await getMessagesService(chatId, page, limit);

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserChats,
  getOrCreateChat,
  getMessages,
};
