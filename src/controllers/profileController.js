const {
  updateProfileService,
  changeUserPassword,
  uniqueProfileService,
} = require("../services/profileService");
const { ValidationError } = require("../utils/errors");

const getProfile = async (req, res, next) => {
  try {
    const {
      email,
      password,
      tokenVersion,
      resetPasswordExpires,
      resetPasswordToken,
      ...safeUser
    } = req.user.toObject();

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

const getUniqueProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    // WHY pass currentUserId explicitly from req.user._id here?
    // The controller's job is to extract HTTP concerns (req, res) and hand off
    // clean values to the service. The service should never touch req/res —
    // that keeps it testable without spinning up an Express server.
    const user = await uniqueProfileService(userId, currentUserId);

    res.status(200).json({
      success: true,
      data: user,
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
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully. Please sign in again.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getUniqueProfile,
  profileEdit,
  changeProfilePassword,
};
