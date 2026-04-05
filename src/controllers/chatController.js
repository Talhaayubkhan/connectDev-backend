const {
  getUserChatsService,
  getOrCreateChatService,
  getMessagesService,
} = require("../services/chatServices");

// GET /chats
// Returns sidebar chat list for logged-in user
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

// GET /chats/user/:targetUserId
// Opens (or creates) a chat with the target user
// Returns: { chat, messages }
const getOrCreateChat = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    // FIX: prevent self-chat (user opening a chat with themselves)
    if (userId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot create a chat with yourself",
      });
    }

    const result = await getOrCreateChatService(userId, targetUserId);

    res.status(200).json({
      success: true,
      data: result, // { chat, messages }
    });
  } catch (error) {
    next(error);
  }
};

// GET /chats/:chatId/messages?page=1&limit=20
// Paginated message history — user must be participant
const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id; // FIX: pass userId for authorization check in service

    const result = await getMessagesService(chatId, userId, page, limit);

    res.status(200).json({
      success: true,
      data: result, // { messages, pagination: { page, limit, total, hasMore } }
    });
  } catch (error) {
    // Forward 403 from service as proper HTTP response
    if (error.statusCode === 403) {
      return res.status(403).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getUserChats,
  getOrCreateChat,
  getMessages,
};
