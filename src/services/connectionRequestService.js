const ConnectionRequest = require("../models/connectionSchema");
const User = require("../models/userSchema");
const { SENDER_FIELDS } = require("../utils/constants");
const { NotFoundError, ValidationError } = require("../utils/errors");

const sendConnectionRequest = async (senderId, receiverId, status) => {
  // check user exists
  const user = await User.findById(receiverId);
  if (!user) {
    throw new NotFoundError("Receiver user not found");
  }

  if (senderId.toString() === receiverId.toString()) {
    throw new ValidationError("Cannot send request to yourself");
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
const acceptConnectionRequest = async (userId, requestId, status) => {
  const request = await ConnectionRequest.findOne({
    _id: requestId,
    receiverUserId: userId,
    status: "interested",
  });

  if (!request) {
    throw new NotFoundError("Connection request not found");
  }

  request.status = status;
  await request.save();

  return request;
};

const getPendingReceivedRequests = async (userId) => {
  const requests = await ConnectionRequest.find({
    receiverUserId: userId,
    status: "interested",
  }).populate("senderUserId", SENDER_FIELDS.join(" "));

  return requests; // return array, empty if none
};

const getAcceptedReceivedRequests = async (userId) => {
  const acceptedRequest = await ConnectionRequest.find({
    $or: [
      { senderUserId: userId, status: "accepted" },
      { receiverUserId: userId, status: "accepted" },
    ],
  })
    .populate("senderUserId", SENDER_FIELDS.join(" "))
    .populate("receiverUserId", SENDER_FIELDS.join(" "))
    .sort({ updatedAt: -1 }); // latest accepted first

  return acceptedRequest; // return array, empty if none
};

const getFeedService = async (userId, limit, skip) => {
  // Get all connection requests involving the user
  const connections = await ConnectionRequest.find({
    $or: [{ senderUserId: userId }, { receiverUserId: userId }],
  }).select("senderUserId receiverUserId");

  // Build blacklist
  const hiddenUsers = new Set();

  connections.forEach((conn) => {
    hiddenUsers.add(conn.senderUserId.toString());
    hiddenUsers.add(conn.receiverUserId.toString());
  });

  // Always exclude self
  hiddenUsers.add(userId.toString());

  // Fetch feed users
  const users = await User.find({
    _id: { $nin: Array.from(hiddenUsers) },
  })
    .skip(skip)
    .limit(limit)
    .select(SENDER_FIELDS);

  return users;
};

module.exports = {
  sendConnectionRequest,
  acceptConnectionRequest,
  getPendingReceivedRequests,
  getAcceptedReceivedRequests,
  getFeedService,
};
