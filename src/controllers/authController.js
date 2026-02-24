const { signupService, loginService } = require("../services/authServices");

const userSignUp = async (req, res, next) => {
  try {
    const data = req.body;
    const user = await signupService(data);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginService(email, password);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: user, // includes safe fields only
    });
  } catch (error) {
    next(error);
  }
};

const userLogout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
  });

  // Send response to client
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    await forgotPasswordService(email);

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    await resetPasswordService(token, newPassword);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  userSignUp,
  userLogin,
  userLogout,
  forgotPassword,
  resetPassword,
};
