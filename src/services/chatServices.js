const Chat = require("../models/chatSchema");
const Message = require("../models/messageSchema");

const CHAT_USER_FIELDS = "firstName lastName photoURL";

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

const getOrCreateChatService = async (userId, targetUserId) => {
  let chat = await Chat.findOne({
    participants: { $all: [userId, targetUserId] },
  })
    .populate("participants", "firstName lastName photoURL")
    .populate({
      path: "lastMessage",
      select: "text sender createdAt",
      populate: {
        path: "sender",
        select: "firstName lastName photoURL",
      },
    });

  if (!chat) {
    chat = await Chat.create({
      participants: [userId, targetUserId],
    });

    chat = await chat.populate("participants", "firstName lastName photoURL");
  }

  const otherUser = chat.participants.find(
    (p) => p._id.toString() !== userId.toString(),
  );

  // Transform lastMessage
  const lastMessage = chat.lastMessage
    ? {
        _id: chat.lastMessage._id,
        text: chat.lastMessage.text,
        createdAt: chat.lastMessage.createdAt,
        sender: chat.lastMessage.sender,
        isMine: chat.lastMessage.sender._id.toString() === userId.toString(),
      }
    : null;

  const messages = await Message.find({ chat: chat._id })
    .sort({ createdAt: -1 })
    .limit(20);

  return {
    chat: {
      _id: chat._id,
      otherUser,
      lastMessage,
      updatedAt: chat.updatedAt,
    },
    messages,
  };
};

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
