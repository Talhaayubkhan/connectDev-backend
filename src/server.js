const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    console.log("Database Connected Successfully!");

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    return server;
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
    throw error;
  }
};

if (require.main === module) {
  startServer().catch(() => {
    // Startup failure has already been logged.
  });
}

module.exports = { startServer };
