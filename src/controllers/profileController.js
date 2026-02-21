const {
  updateProfileService,
  changeUserPassword,
} = require("../services/profileService");
const createPasswordDTO = require("../utils/changePasswordDTO");

const getProfile = async (req, res, next) => {
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
    next(error);
  }
};

const profileEdit = async (req, res, next) => {
  try {
    const updatedUser = await updateProfileService(req.body, req.user);

    const { password, tokenVersion, email, ...safeUser } =
      updatedUser.toObject();

    // console.log(safeUser);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

const changeProfilePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = createPasswordDTO(req.body);
    const userId = req.user._id;
    await changeUserPassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, profileEdit, changeProfilePassword };
