const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { getCorsOptions, getRuntimeConfig } = require("./config/env");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const connectionRequestRouter = require("./routes/connectionRequestRoutes");
const userRouter = require("./routes/userRouter");

const createApp = (config = getRuntimeConfig()) => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(getCorsOptions(config)));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.status(200).json({ success: true, status: "ok" });
  });

  app.use("/", authRouter);
  app.use("/", profileRouter);
  app.use("/", connectionRequestRouter);
  app.use("/", userRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

const app = createApp();

module.exports = app;
module.exports.createApp = createApp;
