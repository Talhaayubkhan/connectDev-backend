const {
  sendConnectionRequest,
} = require("../services/connectionRequestService");
const User = require("../models/userSchema");

const sendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.toUserId;
    const status = req.params.status;

    const data = await sendConnectionRequest(senderId, receiverId, status);

    return res.status(201).json({
      success: true,
      message: `User ${status}`,
      data,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { sendRequest };
