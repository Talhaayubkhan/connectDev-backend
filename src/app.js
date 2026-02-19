const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");

app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const connctionRequestRouter = require("./routes/connectionRequestRoutes");
const errorHandler = require("./middlewares/errorHandler");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", connctionRequestRouter);

app.use(errorHandler);
module.exports = app;
