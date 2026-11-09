const User = require("../models/userSchema");
const Connection = require("../models/connectionSchema");
const {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} = require("../utils/errors");
const {
  validateProfileData,
  validatePasswordChange,
  requireObjectId,
} = require("../utils/validation");
const { SENDER_FIELDS } = require("../utils/constants");

const uniqueProfileService = async (userId, currentUserId) => {
  requireObjectId(userId, "user ID");

  const user = await User.findById(userId).select(SENDER_FIELDS.join(" "));
  if (!user) throw new NotFoundError("User not found.");

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
      throw new ForbiddenError("You can only view profiles of connections.");
    }
  }

  return user;
};

const updateProfileService = async (bodyData, presentUser) => {
  const sanitized = validateProfileData(bodyData);

  for (const [field, value] of Object.entries(sanitized)) {
    if (typeof presentUser.set === "function") presentUser.set(field, value);
    else presentUser[field] = value;
  }

  await presentUser.save();
  return presentUser;
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
  validatePasswordChange(currentPassword, newPassword);

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found.");

  const isMatch = await user.validatePassword(currentPassword);
  if (!isMatch) throw new ValidationError("Current password is incorrect.");

  const isSame = await user.validatePassword(newPassword);
  if (isSame)
    throw new ValidationError(
      "New password cannot be the same as current password.",
    );

  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  return true;
};

module.exports = {
  uniqueProfileService,
  updateProfileService,
  changeUserPassword,
};
