const {
  getPendingReceivedRequests,
  getAcceptedReceivedRequests,
  getFeedService,
} = require("../services/connectionRequestService");

const showAllReceivedRequests = async (req, res, next) => {
  try {
    const connections = await getPendingReceivedRequests(req.user._id);

    // WHY return [] not throw NotFoundError?
    // Empty array = valid state — user just has no requests yet.
    // Throwing 404 was causing frontend to show error page.
    // Frontend already handles empty array with "No Requests Yet" UI.
    res.status(200).json({
      success: true,
      message: "Fetched pending connections successfully.",
      data: connections,
    });
  } catch (error) {
    next(error);
  }
};

const showAllAcceptedRequests = async (req, res, next) => {
  try {
    const loggedInUser = req.user._id;
    const connections = await getAcceptedReceivedRequests(loggedInUser);

    // WHY return [] not throw NotFoundError? Same reason as above.
    const result = connections.map((row) =>
      row.senderUserId._id.toString() === loggedInUser.toString()
        ? row.receiverUserId
        : row.senderUserId,
    );

    res.status(200).json({
      success: true,
      message: "Fetched accepted connections successfully.",
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
