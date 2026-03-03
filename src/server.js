const app = require("./app");
const http = require("http");
const connectDB = require("./config/database");
const { initSocket } = require("./utils/socket");

const PORT = process.env.PORT || 3000;

// Create HTTP server using express app
const server = http.createServer(app);

// Initialize socket with HTTP server
initSocket(server);

connectDB()
  .then(() => {
    console.log("Database Connected Successfully!");

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed!");
  });
