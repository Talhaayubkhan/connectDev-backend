require("dotenv").config();
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const errorHandler = require("./middlewares/errorHandler");

app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const connctionRequestRouter = require("./routes/connectionRequestRoutes");
const userRouter = require("./routes/userRouter");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", connctionRequestRouter);
app.use("/", userRouter);

app.use(errorHandler);
module.exports = app;
