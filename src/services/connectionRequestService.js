const ConnectionRequest = require("../models/connectionSchema");
const User = require("../models/userSchema");
const { SENDER_FIELDS } = require("../utils/constants");
const {
  ConflictError,
  NotFoundError,
  ValidationError,
} = require("../utils/errors");
const { requireObjectId } = require("../utils/validation");

const SEND_STATUSES = new Set(["interested", "ignored"]);
const REVIEW_STATUSES = new Set(["accepted", "rejected"]);

const requireStatus = (status, allowedStatuses) => {
  if (!allowedStatuses.has(status)) {
    throw new ValidationError("Invalid connection request status.");
  }
};

const sendConnectionRequest = async (senderId, receiverId, status) => {
  requireObjectId(senderId, "sender ID");
  requireObjectId(receiverId, "receiver ID");
  requireStatus(status, SEND_STATUSES);

  if (senderId.toString() === receiverId.toString()) {
    throw new ValidationError("Cannot send request to yourself.");
  }

  const receiverExists = await User.exists({ _id: receiverId });
  if (!receiverExists) throw new NotFoundError("User not found.");

  const existing = await ConnectionRequest.findOne({
    $or: [
      { senderUserId: senderId, receiverUserId: receiverId },
      { senderUserId: receiverId, receiverUserId: senderId },
    ],
  });
  if (existing) {
    throw new ConflictError("A connection request already exists.");
  }

  const request = new ConnectionRequest({
    senderUserId: senderId,
    receiverUserId: receiverId,
    status,
  });

  try {
    return await request.save();
  } catch (error) {
    // WHY: the unique index is the final guard when concurrent requests race.
    if (error.code === 11000) {
      throw new ConflictError("A connection request already exists.");
    }
    throw error;
  }
};

const acceptConnectionRequest = async (userId, requestId, status) => {
  requireObjectId(userId, "user ID");
  requireObjectId(requestId, "request ID");
  requireStatus(status, REVIEW_STATUSES);

  const connectionRequest = await ConnectionRequest.findOneAndUpdate(
    {
      _id: requestId,
      receiverUserId: userId,
      status: "interested",
    },
    { $set: { status } },
    { new: true, runValidators: true },
  );

  if (!connectionRequest) {
    throw new NotFoundError("Pending connection request not found.");
  }
  return connectionRequest;
};

const getPendingReceivedRequests = (userId) =>
  ConnectionRequest.find({
    receiverUserId: userId,
    status: "interested",
  }).populate("senderUserId", SENDER_FIELDS.join(" "));

const getAcceptedReceivedRequests = (userId) =>
  ConnectionRequest.find({
    $or: [
      { senderUserId: userId, status: "accepted" },
      { receiverUserId: userId, status: "accepted" },
    ],
  })
    .populate("senderUserId", SENDER_FIELDS.join(" "))
    .populate("receiverUserId", SENDER_FIELDS.join(" "))
    .sort({ updatedAt: -1 });

const getFeedService = async (userId, limit, skip) => {
  const connections = await ConnectionRequest.find({
    $or: [{ senderUserId: userId }, { receiverUserId: userId }],
  })
    .select("senderUserId receiverUserId")
    .lean();

  const excludedUserIds = new Set([userId.toString()]);
  for (const connection of connections) {
    excludedUserIds.add(connection.senderUserId.toString());
    excludedUserIds.add(connection.receiverUserId.toString());
  }

  const users = await User.find({
    _id: { $nin: [...excludedUserIds] },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .select(SENDER_FIELDS.join(" "))
    .lean();

  const hasNextPage = users.length > limit;
  if (hasNextPage) users.pop();
  return { users, hasNextPage };
};

module.exports = {
  acceptConnectionRequest,
  getAcceptedReceivedRequests,
  getFeedService,
  getPendingReceivedRequests,
  sendConnectionRequest,
};
