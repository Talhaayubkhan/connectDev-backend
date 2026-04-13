const {
  signupService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
} = require("../services/authServices");
const { authTokenCookieOptions } = require("../utils/constants");
const {
  validateForgotPasswordEmail,
  validateResetToken,
  validateResetPassword,
} = require("../utils/validation");

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

    // Store JWT in an httpOnly cookie (see authTokenCookieOptions above).
    // Alternative is returning the token in JSON and using localStorage — easier for SPAs, but any XSS can steal it; httpOnly cookies are a common tradeoff.
    res.cookie("token", token, authTokenCookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const userLogout = (req, res) => {
  // Pass the same flags as res.cookie(...), otherwise some browsers keep the old cookie.
  res.clearCookie("token", {
    httpOnly: authTokenCookieOptions.httpOnly,
    path: authTokenCookieOptions.path,
    sameSite: authTokenCookieOptions.sameSite,
    secure: authTokenCookieOptions.secure,
  });
  res.status(200).json({ success: true, message: "Logout successful" });
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // WHY validate email presence here not in service?
    // Controller = validate request. Service = business logic.
    const validatedEmail = validateForgotPasswordEmail(email);

    await forgotPasswordService(validatedEmail);
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
    let { token, newPassword, confirmPassword } = req.body;
    token = validateResetToken(token);
    newPassword = validateResetPassword(newPassword, confirmPassword);

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
