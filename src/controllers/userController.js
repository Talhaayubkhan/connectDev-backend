const {
  getPendingReceivedRequests,
  getAcceptedReceivedRequests,
} = require("../services/connectionRequestService");
const { NotFoundError } = require("../utils/errors");

const showAllReceivedRequests = async (req, res, next) => {
  try {
    const loggedInUser = req.user._id;

    const connections = await getPendingReceivedRequests(loggedInUser);

    if (!connections || connections.length === 0) {
      throw new NotFoundError("No pending connection requests found");
    }

    res.status(200).json({
      success: true,
      message: "Fetched pending connections successfully!",
      data: connections,
    });
  } catch (error) {
    next(error);
  }
};

const showAllAcceptedRequests = async (req, res, next) => {
  try {
    // frist get the logged in user id from req.user
    const loggedInUser = req.user._id;
    // then call a service function to get all accepted requests for that user
    const connections = await getAcceptedReceivedRequests(loggedInUser);
    // if no accepted requests found, throw a not found error
    if (!connections || connections.length === 0) {
      throw new NotFoundError("No accepted connection requests found");
    }

    const result = connections.map((row) => {
      if (row.senderUserId._id.toString() === loggedInUser.toString()) {
        return row.receiverUserId;
      } else {
        return row.senderUserId;
      }
    });

    // else return the accepted requests in response
    res.status(200).json({
      success: true,
      message: "Fetch Accepted connections successfully!",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  showAllReceivedRequests,
  showAllAcceptedRequests,
  showAllAcceptedRequests,
};
