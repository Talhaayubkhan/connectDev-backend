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

// FIX: unique index on sorted participants prevents:
//  1. Duplicate chats between same two users (race condition on simultaneous create)
//  2. Fast lookup by participant pair
// IMPORTANT: always sort participants before saving → [a,b] and [b,a] are same chat
chatSchema.index({ participants: 1 });

// Compound unique: we sort participants before insert so order is deterministic
// This index prevents double-create race condition
chatSchema.index(
  { "participants.0": 1, "participants.1": 1 },
  { unique: true, sparse: true },
);

// Fast lookup: all chats for a user (sidebar query)
chatSchema.index({ participants: 1, updatedAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
