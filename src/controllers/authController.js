const { signupService, loginService } = require("../services/authServices");

const userSignUp = async (req, res) => {
  try {
    const data = req.body;
    const user = await signupService(data);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await loginService(email, password);

    res.cookie("token", token, { httpOnly: true });

    // 6. Send success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

const userLogout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
  });
  // Send response to client
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

module.exports = {
  userSignUp,
  userLogin,
  userLogout,
};
