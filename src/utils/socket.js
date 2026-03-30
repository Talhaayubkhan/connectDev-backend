const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const { CORS_OPTIONS, generateChatRoomId } = require("./constants");
const Chat = require("../models/chatSchema");
const Message = require("../models/messageSchema");

const initSocket = (server) => {
  const io = socketIO(server, { cors: CORS_OPTIONS });

  // Auth Middleware
  // Runs BEFORE every connection — like a security guard at the door
  // If token is missing or invalid, socket never connects at all
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      // Reject immediately if no token provided
      if (!token) {
        return next(new Error("No token. Access denied."));
      }

      // Verify token using your JWT secret — throws if expired or tampered
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // decoded → { _id: '69bbda3a...', tokenVersion: 0, iat: ..., exp: ... }

      // Attach decoded payload to socket — accessible everywhere as socket.user
      socket.user = decoded;

      next();
    } catch (err) {
      // Catches expired tokens, invalid signatures, tampered tokens
      next(new Error("Invalid token."));
    }
  });

  // Connection Handler
  // Only runs if auth middleware called next() successfully
  io.on("connection", (clientSocket) => {
    // Join Chat Room
    // Frontend emits this when user opens a chat page
    clientSocket.on("joinChat", ({ receiverId }) => {
      // ✅ Always get senderId from JWT — never trust what client sends
      const senderId = clientSocket.user._id;

      if (!receiverId) {
        console.warn(`[Socket] joinChat: missing receiverId`);
        return;
      }

      // generateChatRoomId sorts + hashes both IDs → same room for A↔B always
      const roomId = generateChatRoomId(senderId, receiverId);

      clientSocket.join(roomId);
    });

    // Send Message
    // Frontend emits this when user hits Send or presses Enter
    clientSocket.on(
      "sendMessage",
      async ({ receiverId, text, senderFirstName }) => {
        try {
          const senderId = clientSocket.user._id;

          if (!receiverId || !text?.trim()) {
            console.warn(`[Socket] sendMessage: missing data`);
            return;
          }

          const cleanText = text.trim();

          // STEP 1: Find or create chat
          let chat = await Chat.findOne({
            participants: { $all: [senderId, receiverId] },
          });

          if (!chat) {
            chat = await Chat.create({
              participants: [senderId, receiverId],
            });
          }

          // STEP 2: ALWAYS create message (THIS WAS YOUR MAIN BUG)
          const message = await Message.create({
            chatId: chat._id,
            sender: senderId,
            text: cleanText,
          });

          // STEP 3: Update last message
          await Chat.findByIdAndUpdate(chat._id, {
            lastMessage: message._id,
          });

          // STEP 4: Emit to room
          const roomId = generateChatRoomId(senderId, receiverId);

          clientSocket.to(roomId).emit("messageReceived", {
            _id: message._id,
            chatId: chat._id,
            sender: senderId,
            text: cleanText,
            createdAt: message.createdAt,
            firstName: senderFirstName,
          });
        } catch (error) {
          console.error(`[Socket] sendMessage error:`, error);
        }
      },
    );
  });

  return io;
};

module.exports = { initSocket };
