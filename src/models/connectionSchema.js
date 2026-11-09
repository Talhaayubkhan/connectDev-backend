const mongoose = require("mongoose");
const { Schema } = mongoose;

const connectionSchema = new Schema(
  {
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
// WHY: these indexes support the pending and accepted list queries at scale.
connectionSchema.index({ receiverUserId: 1, status: 1, updatedAt: -1 });
connectionSchema.index({ senderUserId: 1, status: 1, updatedAt: -1 });

const ConnectionRequestModel = mongoose.model(
  "ConnectionRequest",
  connectionSchema,
);
module.exports = ConnectionRequestModel;
