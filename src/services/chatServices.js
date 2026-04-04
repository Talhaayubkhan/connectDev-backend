// const Chat = require("../models/chatSchema");
// const Message = require("../models/messageSchema");

// const CHAT_USER_FIELDS = "firstName lastName photoURL";

// // Sidebar chats
// const getUserChatsService = async (userId) => {
//   const chats = await Chat.find({
//     participants: userId,
//   })
//     .populate("participants", CHAT_USER_FIELDS)
//     .populate({
//       path: "lastMessage",
//       select: "text sender createdAt",
//       populate: {
//         path: "sender",
//         select: "firstName lastName photoURL",
//       },
//     })
//     .sort({ updatedAt: -1 });

//   return chats.map((chat) => {
//     const otherUser = chat.participants.find(
//       (p) => p._id.toString() !== userId.toString(),
//     );

//     return {
//       _id: chat._id,
//       otherUser,
//       lastMessage: chat.lastMessage,
//       updatedAt: chat.updatedAt,
//     };
//   });
// };

// // Open chat
// const getOrCreateChatService = async (userId, targetUserId) => {
//   let chat = await Chat.findOne({
//     participants: { $all: [userId, targetUserId] },
//   })
//     .populate("participants", CHAT_USER_FIELDS)
//     .populate("lastMessage");

//   if (!chat) {
//     chat = await Chat.create({
//       participants: [userId, targetUserId],
//     });

//     chat = await chat.populate("participants", CHAT_USER_FIELDS);
//   }

//   const otherUser = chat.participants.find(
//     (p) => p._id.toString() !== userId.toString(),
//   );

//   // Fetch latest 20 messages
//   const messages = await Message.find({ chat: chat._id })
//     .sort({ createdAt: -1 })
//     .limit(20);

//   return {
//     chat: {
//       _id: chat._id,
//       otherUser,
//       updatedAt: chat.updatedAt,
//     },
//     messages,
//   };
// };

// // Pagination
// const getMessagesService = async (chatId, page, limit) => {
//   const skip = (page - 1) * limit;

//   return await Message.find({ chat: chatId })
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit);
// };

// module.exports = {
//   getUserChatsService,
//   getOrCreateChatService,
//   getMessagesService,
// };

const Chat = require("../models/chatSchema");
const Message = require("../models/messageSchema");

const CHAT_USER_FIELDS = "firstName lastName photoURL";

// ─────────────────────────────────────────────
// 1. Sidebar: all chats for a user
// ─────────────────────────────────────────────
const getUserChatsService = async (userId) => {
  const chats = await Chat.find({ participants: userId })
    .populate("participants", CHAT_USER_FIELDS)
    .populate({
      path: "lastMessage",
      select: "text sender createdAt",
    })
    .sort({ updatedAt: -1 })
    .lean(); // lean() = plain JS objects, faster for read-only

  return chats.map((chat) => {
    const otherUser = chat.participants.find(
      (p) => p._id.toString() !== userId.toString(),
    );

    // Attach isMine flag so frontend can show "You: ..." prefix without extra logic
    const lastMessage = chat.lastMessage
      ? {
          ...chat.lastMessage,
          isMine: chat.lastMessage.sender?.toString() === userId.toString(),
        }
      : null;

    return {
      _id: chat._id,
      otherUser,
      lastMessage,
      updatedAt: chat.updatedAt,
    };
  });
};

// ─────────────────────────────────────────────
// 2. Open or create a chat between two users
// ─────────────────────────────────────────────
const getOrCreateChatService = async (userId, targetUserId) => {
  // Find existing chat where BOTH users are participants
  let chat = await Chat.findOne({
    participants: { $all: [userId, targetUserId] },
  })
    .populate("participants", CHAT_USER_FIELDS)
    .lean();

  if (!chat) {
    try {
      // Sort participants so the unique index is order-independent
      const newChat = await Chat.create({
        participants: [userId, targetUserId].sort(),
      });
      chat = await Chat.findById(newChat._id)
        .populate("participants", CHAT_USER_FIELDS)
        .lean();
    } catch (err) {
      // FIX: handle duplicate key error from race condition (two users opening chat simultaneously)
      // E11000 = MongoDB duplicate key error code
      if (err.code === 11000) {
        chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        })
          .populate("participants", CHAT_USER_FIELDS)
          .lean();
      } else {
        throw err;
      }
    }
  }

  const otherUser = chat.participants.find(
    (p) => p._id.toString() !== userId.toString(),
  );

  // FIX: field name is now `chat` (was `chatId`) — consistent with messageSchema
  const messages = await Message.find({ chat: chat._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    chat: {
      _id: chat._id,
      otherUser,
      updatedAt: chat.updatedAt,
    },
    messages,
  };
};

// ─────────────────────────────────────────────
// 3. Paginated messages for a chat
//    SECURITY: verifies userId is a participant
// ─────────────────────────────────────────────
const getMessagesService = async (chatId, userId, page, limit) => {
  // FIX: authorization check — user must be a participant in this chat
  const chat = await Chat.findOne({
    _id: chatId,
    participants: userId,
  }).lean();

  if (!chat) {
    const err = new Error("Chat not found or access denied");
    err.statusCode = 403;
    throw err;
  }

  // FIX: sanitize + clamp pagination params (query strings are always strings)
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(Math.max(1, parseInt(limit) || 20), 100); // max 100 per page
  const skip = (pageNum - 1) * limitNum;

  // FIX: field name is `chat` (was querying `{ chat: chatId }` against `chatId` field — returned nothing)
  const [messages, total] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  return {
    messages,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      hasMore: skip + messages.length < total,
    },
  };
};

// ─────────────────────────────────────────────
// 4. Save a new message + update chat.lastMessage
//    Called from socket handler after validating sender
// ─────────────────────────────────────────────
const saveMessageService = async (chatId, senderId, text) => {
  // Verify sender is a participant before saving
  const chat = await Chat.findOne({
    _id: chatId,
    participants: senderId,
  });

  if (!chat) {
    const err = new Error("Chat not found or access denied");
    err.statusCode = 403;
    throw err;
  }

  const message = await Message.create({
    chat: chatId, // FIX: was `chatId` field name in old schema
    sender: senderId,
    text: text.trim(),
  });

  // Update sidebar preview
  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
    updatedAt: new Date(),
  });

  return message;
};

module.exports = {
  getUserChatsService,
  getOrCreateChatService,
  getMessagesService,
  saveMessageService,
};
