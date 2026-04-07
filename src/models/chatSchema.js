// models/chatSchema.js
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true },
);

// 🔴 ALWAYS ensure sorted participants BEFORE save
chatSchema.pre("save", function (next) {
  if (this.participants.length === 2) {
    this.participants.sort();
  }
  next();
});

// Prevent duplicate chats
chatSchema.index(
  { "participants.0": 1, "participants.1": 1 },
  { unique: true },
);

// Fast sidebar query
chatSchema.index({ participants: 1, updatedAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
