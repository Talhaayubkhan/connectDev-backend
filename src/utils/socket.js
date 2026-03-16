const socket = require("socket.io");
const { CORS_OPTIONS, generateChatRoomId } = require("./constants");
const jwt = require("jsonwebtoken");
const { AuthError } = require("../utils/errors/index");

const initSocket = (server) => {
  const io = socket(server, { cors: CORS_OPTIONS });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      const user = jwt.verify(token);

      socket.user = user;

      next();
    } catch (err) {
      next(new AuthError("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user.firstName);

    socket.on("joinChat", ({ targetUserId }) => {
      const userId = socket.user._id;

      const roomId = generateChatRoomId(userId, targetUserId);

      socket.join(roomId);

      console.log(`${socket.user.firstName} joined room ${roomId}`);
    });

    socket.on("sendMessage", ({ targetUserId, text }) => {
      const userId = socket.user._id;

      const roomId = generateChatRoomId(userId, targetUserId);

      io.to(roomId).emit("messageReceived", {
        senderId: userId,
        firstName: socket.user.firstName,
        text,
      });
    });
  });

  return io;
};

module.exports = { initSocket };
