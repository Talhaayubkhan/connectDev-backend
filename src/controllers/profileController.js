const { updateProfileService } = require("../services/profileService");

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

const profileUpdate = async (req, res) => {
  try {
    const userId = req.params?.userId;
    const userData = req.body;
    const { user } = await updateProfileService(userId, userData);

    const { password, __v, ...safeUser } = user.toObject();

    res.status(200).json({
      success: true,
      message: "Profile Updated successfully",
      data: safeUser,
    });
  } catch (error) {
    console.error(error);

    res.status(error || 400).json({
      success: false,
      message: error.message || "Update failed",
    });
  }
};

module.exports = { getProfile, profileUpdate };
