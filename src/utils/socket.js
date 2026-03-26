const socket = require("socket.io");
const { CORS_OPTIONS, generateChatRoomId } = require("./constants");

const initSocket = (server) => {
  const io = socket(server, { cors: CORS_OPTIONS });

  io.on("connection", (socket) => {
    socket.on("joinChat", () => {});

    socket.on("sendMessage", () => {});
  });
  return io;
};

module.exports = { initSocket };
