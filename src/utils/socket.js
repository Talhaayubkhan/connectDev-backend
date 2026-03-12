const socket = require("socket.io");
const { CORS_OPTIONS } = require("./constants");

const initSocket = (server) => {
  const io = socket(server, { cors: CORS_OPTIONS });

  io.on("connection", (socket) => {
    // console.log("User connected:", socket.id);

    socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
      // console.log("User Join:", userId, targetUserId);
      const roomId = [userId, targetUserId].sort().join("_");
      socket.join(roomId);

      console.log(`${firstName} User joined room ${roomId}`);
    });

    socket.on("sendMessage", ({ firstName, userId, targetUserId, text }) => {
      const roomId = [userId, targetUserId].sort().join("_");
      console.log(`${firstName} has received message - ${text}`);

      io.to(roomId).emit("messageReceived", { firstName, text });
    });
  });

  return io;
};

module.exports = { initSocket };
