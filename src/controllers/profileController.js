const {
  updateProfileService,
  changeUserPassword,
  uniqueProfileService,
} = require("../services/profileService");
const { authTokenCookieOptions } = require("../utils/constants");
const { serializeUser } = require("../utils/userSerializer");

const getProfile = async (req, res, next) => {
  try {
    const safeUser = serializeUser(req.user, { includeEmail: true });

    res.status(200).json({
      success: true,
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

    const user = await uniqueProfileService(userId, currentUserId);
    const safeUser = serializeUser(user);

    res.status(200).json({
      success: true,
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

const profileEdit = async (req, res, next) => {
  try {
    const updatedUser = await updateProfileService(req.body, req.user);

    const safeUser = serializeUser(updatedUser, { includeEmail: true });

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

    await changeUserPassword(req.user._id, currentPassword, newPassword);

    res.clearCookie("token", {
      httpOnly: authTokenCookieOptions.httpOnly,
      path: authTokenCookieOptions.path,
      sameSite: authTokenCookieOptions.sameSite,
      secure: authTokenCookieOptions.secure,
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
  profileEdit,
  changeProfilePassword,
  getUniqueProfile,
};
