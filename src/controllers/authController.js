const {
  signupService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
} = require("../services/authServices");

const userSignUp = async (req, res, next) => {
  try {
    const user = await signupService(req.body);
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
      // WHY add secure in production?
      // secure: true = cookie only sent over HTTPS
      // In dev it would block localhost, so check NODE_ENV
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res
      .status(200)
      .json({ success: true, message: "Login successful", data: user });
  } catch (error) {
    next(error);
  }
};

const userLogout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ success: true, message: "Logout successful" });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // WHY validate email presence here not in service?
    // Controller = validate request. Service = business logic.
    if (!email)
      throw new (require("../utils/errors").ValidationError)(
        "Email is required.",
      );
    await forgotPasswordService(email);
    res.status(200).json({
      success: true,
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    await resetPasswordService(token, newPassword, confirmPassword);
    res.status(200).json({
      success: true,
      message: "Password reset successful. Please sign in.",
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
