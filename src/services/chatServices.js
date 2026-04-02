// services/chatServices.js

const Chat = require("../models/chatSchema");
const Message = require("../models/messageSchema");

const CHAT_USER_FIELDS = "firstName lastName photoURL";

// Sidebar chats
const getUserChatsService = async (userId) => {
  const chats = await Chat.find({
    participants: userId,
  })
    .populate("participants", CHAT_USER_FIELDS)
    .populate("lastMessage", "text sender createdAt")
    .sort({ updatedAt: -1 });

  return chats.map((chat) => {
    const otherUser = chat.participants.find(
      (p) => p._id.toString() !== userId.toString(),
    );

    return {
      _id: chat._id,
      otherUser,
      lastMessage: chat.lastMessage,
      updatedAt: chat.updatedAt,
    };
  });
};

// Open chat
const getOrCreateChatService = async (userId, targetUserId) => {
  let chat = await Chat.findOne({
    participants: { $all: [userId, targetUserId] },
  })
    .populate("participants", CHAT_USER_FIELDS)
    .populate("lastMessage");

  if (!chat) {
    chat = await Chat.create({
      participants: [userId, targetUserId],
    });

    chat = await chat.populate("participants", CHAT_USER_FIELDS);
  }

  const otherUser = chat.participants.find(
    (p) => p._id.toString() !== userId.toString(),
  );

  // Fetch latest 20 messages
  const messages = await Message.find({ chat: chat._id })
    .sort({ createdAt: -1 })
    .limit(20);

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

module.exports = {
  getUserChatsService,
  getOrCreateChatService,
  getMessagesService,
};
