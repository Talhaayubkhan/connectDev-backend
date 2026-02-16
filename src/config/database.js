const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://talhaayub_db:oPtL5cr5pDPCCoRb@cluster0.imvwfcb.mongodb.net/ConnectDev",
  );
};

module.exports = connectDB;
