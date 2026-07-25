const app = require("./app");
const http = require("http");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    console.log("Database Connected Successfully!");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(() => {
    console.error("Database connection failed!");
  });
