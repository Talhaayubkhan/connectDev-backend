const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    age: {
      type: Number,
      min: 13,
      max: 100,
    },

    gender: {
      type: String,
      enum: ["male", "female", "others"],
      default: "other",
    },

    photoURL: {
      type: String,
      default: "https://default-avatar.com/avatar.png",
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    about: {
      type: String,
      maxlength: 500,
      default: "Hey there! I am using ConnectDev.",
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  },
);

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
