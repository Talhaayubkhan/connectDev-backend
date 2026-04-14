const Chat = require("../models/chatSchema");
const Message = require("../models/messageSchema");
const { generateAiChat } = require("../utils/gemini");

const CHAT_USER_FIELDS = "firstName lastName photoURL";

// Sidebar chats
const getUserChatsService = async (userId) => {
  const chats = await Chat.find({
    participants: userId,
  })
    .populate("participants", CHAT_USER_FIELDS)
    .populate({
      path: "lastMessage",
      select: "text sender createdAt",
      populate: {
        path: "sender",
        select: CHAT_USER_FIELDS,
      },
    })
    .sort({ updatedAt: -1 });

  return chats.map((chat) => {
    const otherUser = chat.participants.find(
      (p) => p._id.toString() !== userId.toString(),
    );

    return {
      _id: chat._id,
      otherUser,
      lastMessage: chat.lastMessage || null,
      updatedAt: chat.updatedAt,
    };
  });
};

// Open chat
const getOrCreateChatService = async (userId, targetUserId) => {
  const participants = [userId, targetUserId].sort();

  let chat = await Chat.findOne({
    participants: { $all: participants },
  })
    .populate("participants", CHAT_USER_FIELDS)
    .populate("lastMessage");

  if (!chat) {
    try {
      chat = await Chat.create({ participants });
      chat = await chat.populate("participants", CHAT_USER_FIELDS);
    } catch (error) {
      // Handle race condition (duplicate creation)
      chat = await Chat.findOne({
        participants: { $all: participants },
      }).populate("participants", CHAT_USER_FIELDS);
    }
  }

  const otherUser = chat.participants.find(
    (p) => p._id.toString() !== userId.toString(),
  );

  // Latest 20 messages → then reverse for UI
  let messages = await Message.find({ chat: chat._id })
    .sort({ createdAt: -1 })
    .limit(20);

  messages = messages.reverse();

  return {
    chat: {
      _id: chat._id,
      otherUser,
      updatedAt: chat.updatedAt,
    },
    messages,
  };
};

// Pagination
const getMessagesService = async (chatId, page, limit) => {
  const skip = (page - 1) * limit;

  return await Message.find({ chat: chatId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

const processChatMessage = async (messages) => {
  // Tomorrow you add DB calls HERE, not in controller
  // Example future additions:
  // await checkUserMessageLimit(userId);
  // await ChatHistory.create({ messages });

  const reply = await generateAiChat(messages);
  if (
    reply.includes("error") ||
    reply.includes(
      "This model is currently experiencing high demand, please try again later",
    )
  ) {
    throw new ValidationError(
      "This model is currently experiencing high demand, please try again later",
    );
  }

  // You could transform the reply here if needed
  // Example: strip markdown, add metadata, etc.

  return reply;
};

module.exports = {
  getUserChatsService,
  getOrCreateChatService,
  getMessagesService,
  processChatMessage,
};
