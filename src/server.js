const app = require("./app");
const connectDB = require("./config/database");
const mongoose = require("mongoose");

let httpServer;

const startServer = async ({ config = {} } = {}) => {
  try {
    await connectDB(config.mongoUrl);

    console.log("Database Connected Successfully!");

    httpServer = app.listen(config.port || process.env.PORT || 3000, () => {
      console.log(
        `Server running on port ${config.port || process.env.PORT || 3000}`,
      );
    });

    return httpServer;
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
    throw error;
  }
};

const shutdown = async () => {
  if (httpServer) {
    const server = httpServer;
    httpServer = undefined;
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  startServer().catch(() => {
    // Startup failure is logged before the rejection reaches this handler.
  });
}

module.exports = { startServer, shutdown };
