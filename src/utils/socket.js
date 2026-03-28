const socketIO = require("socket.io");
const { CORS_OPTIONS } = require("./constants");

const initSocket = (server) => {
  const io = socketIO(server, { cors: CORS_OPTIONS });

  io.on("connection", (clientSocket) => {
    clientSocket.on("joinChat", ({ firstName, IdUser, userId }) => {
      const currentUserId = IdUser;
      const chatPartnerId = userId;

      const chatRoomId = [currentUserId, chatPartnerId].sort().join("_");

      console.log(`${firstName} room joining ${chatRoomId}`);

      clientSocket.join(chatRoomId);
    });

    clientSocket.on("sendMessage", ({ firstName, IdUser, userId, text }) => {
      const currentUserId = IdUser;
      const chatPartnerId = userId;
      const roomId = [currentUserId, chatPartnerId].sort().join("_");
      console.log(`${firstName} has recevied the ${text}`);
      io.to(roomId).emit("messageRecevied", { firstName, text });
    });
  });

  return io;
};

module.exports = { initSocket };
