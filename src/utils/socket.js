const socket = require("socket.io");
const { CORS_OPTIONS } = require("./constants");

const initSocket = (server) => {
  const io = socket(server, { cors: CORS_OPTIONS });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinChat", ({ userId, targetUserId }) => {
      const roomId = [userId, targetUserId].sort().join("_");

      console.log("room joining:", roomId);
      socket.join(roomId);
    });

    socket.on("sendMessage", () => {});
  });
  return io;
};

module.exports = { initSocket };
