const ConnectionRequest = require("../models/connectionSchema");
const User = require("../models/userSchema");
const { SENDER_FIELDS } = require("../utils/constants");
const {
  NotFoundError,
  ValidationError,
  ConflictError,
} = require("../utils/errors");

const sendConnectionRequest = async (senderId, receiverId, status) => {
  const user = await User.findById(receiverId);
  if (!user) throw new NotFoundError("User not found.");

  if (senderId.toString() === receiverId.toString()) {
    throw new ValidationError("Cannot send request to yourself.");
  }

  const exists = await ConnectionRequest.findOne({
    $or: [
      { senderUserId: senderId, receiverUserId: receiverId },
      { senderUserId: receiverId, receiverUserId: senderId },
    ],
  });

  // WHY ConflictError not ValidationError?
  // Data is valid — conflict is that it already exists
  if (exists) throw new ConflictError("Connection already exists.");

  const request = new ConnectionRequest({
    senderUserId: senderId,
    receiverUserId: receiverId,
    status,
  });

  return await request.save();
};

const acceptConnectionRequest = async (userId, requestId, status) => {
  const connectionRequest = await ConnectionRequest.findOne({
    _id: requestId,
    receiverUserId: userId,
    status: "interested",
  });

  if (!connectionRequest)
    throw new NotFoundError("Connection request not found.");

  connectionRequest.status = status;
  await connectionRequest.save();

  return connectionRequest;
};

const getPendingReceivedRequests = async (userId) => {
  return await ConnectionRequest.find({
    receiverUserId: userId,
    status: "interested",
  }).populate("senderUserId", SENDER_FIELDS.join(" "));
};

const getAcceptedReceivedRequests = async (userId) => {
  return await ConnectionRequest.find({
    $or: [
      { senderUserId: userId, status: "accepted" },
      { receiverUserId: userId, status: "accepted" },
    ],
  })
    .populate("senderUserId", SENDER_FIELDS.join(" "))
    .populate("receiverUserId", SENDER_FIELDS.join(" "))
    .sort({ updatedAt: -1 });
};

const getFeedService = async (userId, limit, skip) => {
  const connections = await ConnectionRequest.find({
    $or: [{ senderUserId: userId }, { receiverUserId: userId }],
  })
    .select("senderUserId receiverUserId")
    .lean();

  const excludedUserIds = new Set([userId.toString()]);

  connections.forEach((conn) => {
    excludedUserIds.add(conn.senderUserId.toString());
    excludedUserIds.add(conn.receiverUserId.toString());
  });

  const users = await User.find({
    _id: { $nin: [...excludedUserIds] },
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .select(SENDER_FIELDS)
    .lean();

  const hasNextPage = users.length > limit;
  if (hasNextPage) users.pop();

  return { users, hasNextPage };
};

module.exports = {
  sendConnectionRequest,
  acceptConnectionRequest,
  getPendingReceivedRequests,
  getAcceptedReceivedRequests,
  getFeedService,
};
