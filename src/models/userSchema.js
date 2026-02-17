const mongoose = require("mongoose");
const { Schema } = mongoose;
const validator = require("validator");

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
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Enter a valid email address");
        }
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Enter a strong password");
        }
      },
    },

    age: {
      type: Number,
      min: 13,
      max: 100,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },

    photoURL: {
      type: String,
      default: "https://default-avatar.com/avatar.png",
      trim: true,
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Enter a valid URL");
        }
      },
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
