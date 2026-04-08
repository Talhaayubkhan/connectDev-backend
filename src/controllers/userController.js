const {
  getPendingReceivedRequests,
  getAcceptedReceivedRequests,
  getFeedService,
} = require("../services/connectionRequestService");
const { NotFoundError } = require("../utils/errors");

const showAllReceivedRequests = async (req, res, next) => {
  try {
    const connections = await getPendingReceivedRequests(req.user._id);

    if (!connections.length) {
      throw new NotFoundError("No pending requests found");
    }

    res.status(200).json({
      success: true,
      message: "Fetched pending requests successfully.",
      count: connections.length,
      results: connections,
    });
  } catch (error) {
    next(error);
  }
};

const showAllAcceptedRequests = async (req, res, next) => {
  try {
    const loggedInUser = req.user._id;
    const connections = await getAcceptedReceivedRequests(loggedInUser);

    if (!connections.length) {
      throw new NotFoundError("No accepted requests found");
    }

    const result = connections.map((row) =>
      row.senderUserId._id.toString() === loggedInUser.toString()
        ? row.receiverUserId
        : row.senderUserId,
    );

    res.status(200).json({
      success: true,
      message: "Fetched accepted connections successfully.",
      count: connections.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const feed = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const { users, hasNextPage } = await getFeedService(userId, limit, skip);

    res.status(200).json({
      success: true,
      page,
      limit,
      results: users.length,
      hasNextPage,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { showAllReceivedRequests, showAllAcceptedRequests, feed };
