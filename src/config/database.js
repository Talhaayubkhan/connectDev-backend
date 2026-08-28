const mongoose = require("mongoose");

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

const connectDB = async (mongoUrl) => mongoose.connect(mongoUrl);

module.exports = connectDB;
