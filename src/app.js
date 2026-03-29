require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middlewares/errorHandler");
const { CORS_OPTIONS } = require("./utils/constants");

app.use(express.json());
app.use(cookieParser());
app.use(cors(CORS_OPTIONS));

const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const connctionRequestRouter = require("./routes/connectionRequestRoutes");
const userRouter = require("./routes/userRouter");
const chatRouter = require("./routes/chatRouter");
const messageRouter = require("./routes/messageRouter");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", connctionRequestRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", messageRouter);

app.use(errorHandler);

module.exports = app;
