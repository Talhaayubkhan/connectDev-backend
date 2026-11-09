const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { ForbiddenError } = require("./utils/errors");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");
const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const connectionRequestRouter = require("./routes/connectionRequestRoutes");
const userRouter = require("./routes/userRouter");

const getAllowedOrigins = () => {
  const configuredOrigins = process.env.FRONTEND_URL
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) return configuredOrigins;
  return process.env.NODE_ENV === "production"
    ? []
    : ["http://localhost:5173"];
};

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    // Requests without an Origin header include CLI and server-to-server clients.
    if (!origin || getAllowedOrigins().includes(origin)) {
      return callback(null, true);
    }

    return callback(new ForbiddenError("Origin is not allowed by CORS."));
  },
};

const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors(corsOptions));
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
