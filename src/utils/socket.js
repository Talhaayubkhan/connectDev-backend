const socket = require("socket.io");
const { CORS_OPTIONS } = require("./constants");

const initSocket = (server) => {
  const io = socket(server, { cors: { CORS_OPTIONS } });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinChat", () => {
      console.log("User Join:", socket.id);
    });
  });

  return io;
};

module.exports = { initSocket };
