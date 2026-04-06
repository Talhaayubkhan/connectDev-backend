const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // FIX: renamed from `chatId` to `chat` — Mongoose convention for ObjectId refs
    // was causing { chat: chatId } query in services to return 0 results
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
      trim: true,
    },
  },
  { timestamps: true },
);

// Index for fast message lookup by chat (used in every message fetch)
messageSchema.index({ chat: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
