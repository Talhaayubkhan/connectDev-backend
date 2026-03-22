const { ObjectId } = require("mongodb");
const User = require("../models/userSchema");
const Connection = require("../models/connectionSchema");
const {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} = require("../utils/errors");
const {
  validateProfileData,
  validatePassword,
} = require("../utils/validation");
const { SENDER_FIELDS } = require("../utils/constants");

// service/profile.service.js

const uniqueProfileService = async (userId, currentUserId) => {
  if (!userId) {
    throw new ValidationError("User ID is required");
  }
  if (!ObjectId.isValid(userId)) {
    throw new ValidationError("Invalid user ID format");
  }

  const isSelf = currentUserId.toString() === userId.toString();

  if (!isSelf) {
    const isConnected = await Connection.exists({
      $or: [
        {
          senderUserId: currentUserId,
          receiverUserId: userId,
          status: "accepted",
        },
        {
          senderUserId: userId,
          receiverUserId: currentUserId,
          status: "accepted",
        },
      ],
    });

    if (!isConnected) {
      throw new ForbiddenError("You can only view profiles of connections");
    }
  }
  const user = await User.findById(userId).select(SENDER_FIELDS);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};

const updateProfileService = async (bodyData, presentUser) => {
  validateProfileData(bodyData);

  Object.keys(bodyData).forEach((field) => {
    presentUser[field] = bodyData[field];
  });

  await presentUser.save();
  return presentUser;
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new ValidationError("Both passwords are required.");
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found.");

  const isMatch = await user.validatePassword(currentPassword);
  if (!isMatch) throw new ValidationError("Current password is incorrect.");

  // WHY validate format before checking sameness?
  // If new password fails format validation, no point checking sameness.
  // Validate first → then check business rules.
  validatePassword(newPassword);

  const isSame = await user.validatePassword(newPassword);
  if (isSame)
    throw new ValidationError(
      "New password cannot be same as current password.",
    );

  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();
  return true;
};

// const deleteAccountService = async (userId) => {
//   // 1. Delete user
//   await User.findByIdAndDelete(userId);

//   // 2. Delete all connections
//   await Connection.deleteMany({
//     $or: [{ senderUserId: userId }, { receiverUserId: userId }],
//   });

//   return true;
// };

module.exports = {
  uniqueProfileService,
  updateProfileService,
  changeUserPassword,
};
