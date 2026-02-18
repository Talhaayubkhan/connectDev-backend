const User = require("../models/userSchema");
const {
  updateProfileService,
  changeUserPassword,
} = require("../services/profileService");
const bcrypt = require("bcrypt");

const getProfile = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const profileEdit = async (req, res) => {
  try {
    const userData = req.body;
    const loggedInUser = req.user;

    const updatedUser = await updateProfileService(userData, loggedInUser);

    const { password, __v, ...safeUser } = updatedUser.toObject();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: safeUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Update failed",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user;

    await changeUserPassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getProfile, profileEdit, changePassword };
