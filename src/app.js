const express = require("express");
// const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");

const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const connectionRequestRouter = require("./routes/connectionRequestRoutes");
const userRouter = require("./routes/userRouter");

const app = express();

// Security middleware
app.disable("x-powered-by");
app.use(helmet());

// Request parsing and CORS
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
  });
});

// Application routes
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", connectionRequestRouter);
app.use("/", userRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
