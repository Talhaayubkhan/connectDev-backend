require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/database");

let activeServer;
let shutdownPromise;

const getServerConfig = () => ({
  mongoUrl: process.env.MONGODB_URL?.trim(),
  port: Number(process.env.PORT || 3000),
});

const listen = (application, port) =>
  new Promise((resolve, reject) => {
    const server = application.listen(port, () => resolve(server));
    server.once?.("error", reject);
  });

const startServer = async ({ config = getServerConfig() } = {}) => {
  if (!config.mongoUrl) {
    throw new Error("MONGODB_URL is required.");
  }
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  if (
    typeof process.env.JWT_SECRET !== "string" ||
    process.env.JWT_SECRET.length < 32
  ) {
    throw new Error("JWT_SECRET must be at least 32 characters.");
  }

  await connectDB(config.mongoUrl);
  activeServer = await listen(app, config.port);
  console.log(`Server running on port ${config.port}`);
  return activeServer;
};

const closeHttpServer = (server) =>
  new Promise((resolve, reject) => {
    if (!server) return resolve();
    return server.close((error) => (error ? reject(error) : resolve()));
  });

const shutdown = async (signal) => {
  if (shutdownPromise) return shutdownPromise;

  shutdownPromise = (async () => {
    if (signal) console.log(`Received ${signal}. Shutting down safely.`);
    await closeHttpServer(activeServer);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    activeServer = undefined;
  })();

  try {
    await shutdownPromise;
  } finally {
    shutdownPromise = undefined;
  }
};

const registerProcessHandlers = () => {
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, async () => {
      try {
        await shutdown(signal);
      } catch (error) {
        console.error("Graceful shutdown failed.", error);
        process.exitCode = 1;
      }
    });
  }

  process.once("unhandledRejection", async (error) => {
    console.error("Unhandled promise rejection.", error);
    process.exitCode = 1;
    try {
      await shutdown("unhandledRejection");
    } catch (shutdownError) {
      console.error("Shutdown after rejection failed.", shutdownError);
    }
  });
};

if (require.main === module) {
  registerProcessHandlers();
  startServer().catch((error) => {
    console.error("Server startup failed.", error);
    process.exitCode = 1;
  });
}

module.exports = { registerProcessHandlers, shutdown, startServer };
