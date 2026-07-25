const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URL);

  // ADDED: log if MongoDB drops connection AFTER a successful startup.
  // Without this, a mid-session disconnect (network blip, Atlas restart)
  // fails silently and you'd only notice when requests start throwing errors.
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected");
  });
};

module.exports = connectDB;
