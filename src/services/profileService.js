const User = require("../models/userSchema");
const { NotFoundError, ValidationError } = require("../utils/errors");
const {
  validateProfileData,
  validatePassword,
} = require("../utils/validation");

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
    throw new ValidationError("Both passwords are required");
  }

  const user = await User.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  const isMatch = await user.validatePassword(currentPassword);
  if (!isMatch) throw new ValidationError("Current password is incorrect");

  const isSame = await user.validatePassword(newPassword);
  if (isSame)
    throw new ValidationError("New password cannot be same as old password");

  validatePassword(newPassword);

  user.password = newPassword;
  // we do this if somebody change password, so it again login with new one to access other apis!
  // it is like security check!
  user.tokenVersion += 1;

  await user.save();
  return true;
};

module.exports = { updateProfileService, changeUserPassword };
