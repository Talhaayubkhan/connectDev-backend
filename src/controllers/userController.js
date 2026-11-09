const {
  getPendingReceivedRequests,
  getAcceptedReceivedRequests,
  getFeedService,
} = require("../services/connectionRequestService");
const { parsePagination } = require("../utils/pagination");
const { serializeUser } = require("../utils/userSerializer");

const toObject = (value) =>
  typeof value?.toObject === "function" ? value.toObject() : value;

const serializePendingRequest = (request) => {
  const source = toObject(request);
  if (!source?.senderUserId) return null;

  return {
    _id: source._id?.toString(),
    status: source.status,
    senderUserId: serializeUser(source.senderUserId),
    receiverUserId: source.receiverUserId?.toString(),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};

const showAllReceivedRequests = async (req, res, next) => {
  try {
    const connections = await getPendingReceivedRequests(req.user._id);
    const results = connections.map(serializePendingRequest).filter(Boolean);

    // WHY: an empty collection is a successful query, not a missing resource.
    res.status(200).json({
      success: true,
      message: "Fetched pending requests successfully.",
      count: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

const showAllAcceptedRequests = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id.toString();
    const connections = await getAcceptedReceivedRequests(loggedInUserId);

    const data = connections
      .map(toObject)
      .map((connection) => {
        const sender = connection?.senderUserId;
        const receiver = connection?.receiverUserId;
        if (!sender || !receiver) return null;
        const otherUser =
          sender._id.toString() === loggedInUserId ? receiver : sender;
        return serializeUser(otherUser);
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      message: "Fetched accepted connections successfully.",
      count: data.length,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const feed = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { users, hasNextPage } = await getFeedService(
      req.user._id,
      limit,
      skip,
    );
    const data = users.map((user) => serializeUser(user));

    res.status(200).json({
      success: true,
      page,
      limit,
      results: data.length,
      hasNextPage,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { feed, showAllAcceptedRequests, showAllReceivedRequests };
