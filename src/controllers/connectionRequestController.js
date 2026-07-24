const {
  sendConnectionRequest,
  acceptConnectionRequest,
} = require("../services/connectionRequestService");

const sendRequest = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { toUserId: receiverId, status } = req.params;

    const data = await sendConnectionRequest(senderId, receiverId, status);
    // console.log("Sent connection request successfully", data);

    return res.status(201).json({
      success: true,
      message: `Connection request ${status}.`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const acceptRequest = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { requestId, status } = req.params;

    const result = await acceptConnectionRequest(userId, requestId, status);

    res.status(200).json({
      success: true,
      message: `Connection request ${status}.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendRequest, acceptRequest };
