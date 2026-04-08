const {
  getUserChatsService,
  getOrCreateChatService,
  getMessagesService,
} = require("../services/chatServices");
const { NotFoundError } = require("../utils/errors");

const {
  requireObjectId,
  validateChatAccess,
  validateMessagePagination,
} = require("../utils/validation");

// 1. GET USER CHATS (SIDEBAR)

const getUserChats = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    // validate user
    requireObjectId(userId, "User ID");

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

// 2. OPEN / CREATE CHAT

const getOrCreateChat = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { targetUserId } = req.params;

    // validate both users
    validateChatAccess(userId, targetUserId);

    const result = await getOrCreateChatService(userId, targetUserId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 3. GET MESSAGES (PAGINATION)

const getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    // validate + normalize pagination
    const { page, limit } = validateMessagePagination(
      chatId,
      req.query.page,
      req.query.limit,
    );

    const messages = await getMessagesService(chatId, page, limit);

    if (!messages.length) {
      throw new NotFoundError("No messages found for this chat");
    }

    res.status(200).json({
      success: true,
      count: messages.length,
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
