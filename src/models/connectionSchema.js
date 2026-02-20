const mongoose = require("mongoose");
const { Schema } = mongoose;

const connectionSchema = new Schema(
  {
    // fromUserId
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // toUserId
    receiverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["interested", "accepted", "rejected", "ignored"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
connectionSchema.index(
  { senderUserId: 1, receiverUserId: 1 },
  { unique: true },
);

const ConnectionRequestModel = mongoose.model(
  "ConnectionRequest",
  connectionSchema,
);
module.exports = ConnectionRequestModel;
