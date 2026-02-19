const ConnectionRequest = require("../models/connectionSchema");
const User = require("../models/userSchema");
const { NotFoundError, ValidationError } = require("../utils/errors");

const sendConnectionRequest = async (senderId, receiverId, status) => {
  // validate status
  const allowed = ["interested", "ignored"];
  if (!allowed.includes(status)) {
    throw new ValidationError("Invalid status");
  }

  // check user exists
  const user = await User.findById(receiverId);
  if (!user) {
    throw new NotFoundError("Receiver user not found");
  }

  // check duplicate request
  const exists = await ConnectionRequest.findOne({
    $or: [
      { senderUserId: senderId, receiverUserId: receiverId },
      { senderUserId: receiverId, receiverUserId: senderId },
    ],
  });

  if (exists) {
    throw new ValidationError("Connection already exists");
  }

  // create request
  const request = new ConnectionRequest({
    senderUserId: senderId,
    receiverUserId: receiverId,
    status: status,
  });
  return await request.save();
};

module.exports = { sendConnectionRequest };
