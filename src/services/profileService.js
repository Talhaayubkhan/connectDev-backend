const User = require("../models/userSchema");
const { validateProfileData } = require("../utils/validation");

const updateProfileService = async (updateData, presentUser) => {
  validateProfileData(updateData);

  Object.keys(updateData).forEach((key) => {
    presentUser[key] = updateData[key];
  });

  await presentUser.save();

  return presentUser;
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new Error("Both passwords are required");
  }

  const user = await User.findById(userId);
  // console.log(user);

  if (!user) throw new Error("User not found");

  const isMatch = await user.validatePassword(currentPassword);

  if (!isMatch) throw new Error("Current password is incorrect");

  const isSame = await user.validatePassword(newPassword);
  if (isSame) throw new Error("New password cannot be same as old password");

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  user.password = newPassword;

  await user.save();
  return true;
};

module.exports = { updateProfileService, changeUserPassword };
