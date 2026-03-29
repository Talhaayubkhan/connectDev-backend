const Chat = require("../models/chatSchema");

const getUserChats = async (req, res, next) => {
  try {
    const { userId, targetUserId } = req.body;
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserChats,
};
