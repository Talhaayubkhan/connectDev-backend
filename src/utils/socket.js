const socket = require("socket.io");
const { CORS_OPTIONS, generateChatRoomId } = require("./constants");

const initSocket = (server) => {
  const io = socket(server, { cors: CORS_OPTIONS });

  io.on("connection", (socket) => {
    socket.on("joinChat", ({ userId, targetUserId }) => {
      const roomId = generateChatRoomId(userId, targetUserId);
      // console.log(roomId);

      socket.join(roomId);

      console.log(`${socket.user.firstName} joined ${roomId}`);
    });

    socket.on("sendMessage", ({ userId, targetUserId, text }) => {
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
