const {
  updateProfileService,
  changeUserPassword,
} = require("../services/profileService");
const { ValidationError } = require("../utils/errors");

const getProfile = async (req, res, next) => {
  try {
    const { email, password, tokenVersion, ...safeUser } = req.user.toObject();
    res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

const profileEdit = async (req, res, next) => {
  try {
    const updatedUser = await updateProfileService(req.body, req.user);
    const { password, tokenVersion, email, ...safeUser } =
      updatedUser.toObject();
    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

const changeProfilePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // WHY removed createPasswordDTO?
    // It was just destructuring two fields — unnecessary abstraction.
    // Direct destructuring is cleaner and easier to read.
    if (!currentPassword || !newPassword) {
      throw new ValidationError("Both passwords are required.");
    }

    await changeUserPassword(req.user._id, currentPassword, newPassword);

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      // secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please sign in again.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, profileEdit, changeProfilePassword };
