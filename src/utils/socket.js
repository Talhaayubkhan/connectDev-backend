// const socket = require("socket.io");
// const { CORS_OPTIONS } = require("./constants");

// const initSocket = (server) => {
//   const io = socket(server, { cors: CORS_OPTIONS });
//   io.on("connection", (socket) => {
//     socket.on("joinChat", ({ IdUser, userId }) => {
//       console.log(IdUser, userId);

//       const roomId = [IdUser, userId].sort().join("_");

//       console.log("room joining: " + roomId);
//       socket.join(roomId);
//     });
//   });
//   return io;
// };

// module.exports = { initSocket };

const socketIO = require("socket.io");
const { CORS_OPTIONS } = require("./constants");

const initSocket = (server) => {
  const io = socketIO(server, { cors: CORS_OPTIONS });

  io.on("connection", (clientSocket) => {
    clientSocket.on("joinChat", ({ IdUser, userId }) => {
      const currentUserId = IdUser;
      const chatPartnerId = userId;

      const chatRoomId = [currentUserId, chatPartnerId].sort().join("_");

      console.log("room joining: " + chatRoomId);

      clientSocket.join(chatRoomId);
    });
  });

  return io;
};

module.exports = { initSocket };
