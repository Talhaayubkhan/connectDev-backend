const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 3000;

// CHANGED: removed http.createServer(app) + initSocket(server).
// That setup only existed to attach socket.io to the raw HTTP server.
// Since chat/sockets are removed, app.listen() directly is simpler —
// Express's app.listen() creates its own HTTP server internally anyway.
connectDB()
  .then(() => {
    console.log("Database Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    // CHANGED: log the actual error, not just a generic message.
    // Before, if connectDB() failed, you'd have no idea WHY —
    // wrong URI? Auth failure? Network issue? All looked identical.
    console.error("Database connection failed!", error.message);
  });
