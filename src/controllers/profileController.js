const {
  updateProfileService,
  changeUserPassword,
} = require("../services/profileService");

const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const { password } = user;

    if (!password) {
      throw new Error("Inavlid Credentials!");
    }
    // console.log(user);

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
    // console.log("before filtered!", loggedInUser);

    const updatedUser = await updateProfileService(userData, loggedInUser);

    const { password, __v, tokenVersion, ...safeUser } = updatedUser.toObject();

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

const changeProfilePassword = async (req, res) => {
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

module.exports = { getProfile, profileEdit, changeProfilePassword };
