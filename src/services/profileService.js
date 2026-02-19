const User = require("../models/userSchema");
const { validateProfileData } = require("../utils/validation");

const updateProfileService = async (bodyData, presentUser) => {
  if (!validateProfileData(bodyData)) {
    throw new Error("Invalid data");
  }

  Object.keys(bodyData).forEach((key) => {
    presentUser[key] = bodyData[key];
  });
  await presentUser.save();

  return presentUser;
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
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
  user.tokenVersion += 1;
  await user.save();
  return true;
};

module.exports = { updateProfileService, changeUserPassword };
