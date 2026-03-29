const socketIO = require("socket.io");
const { CORS_OPTIONS, generateChatRoomId } = require("./constants");

const initSocket = (server) => {
  const io = socketIO(server, { cors: CORS_OPTIONS });

  io.on("connection", (clientSocket) => {
    clientSocket.on("joinChat", ({ firstName, IdUser, userId }) => {
      const roomId = generateChatRoomId(IdUser, userId);
      clientSocket.join(roomId);
    });

    clientSocket.on("sendMessage", ({ firstName, IdUser, userId, text }) => {
      const roomId = generateChatRoomId(IdUser, userId);

      // ✅ FIXED HERE
      io.to(roomId).emit("messageReceived", { firstName, text });
    });
  });

  return io;
};

module.exports = { initSocket };
