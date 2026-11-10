const mongoose = require("mongoose");

const connectDB = async (mongoUrl = process.env.MONGODB_URL) => {
  try {
    await mongoose.connect(mongoUrl);

    console.log("MongoDB connected successfully!");

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected!");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected successfully!");
    });

    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;
