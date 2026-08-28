const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/database");
const { getRuntimeConfig } = require("./config/env");

let activeServer;
let shutdownPromise;

const listen = (application, port) =>
  new Promise((resolve, reject) => {
    const server = application.listen(port, () => resolve(server));
    server.once?.("error", reject);
  });

const startServer = async ({ config = getRuntimeConfig() } = {}) => {
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
