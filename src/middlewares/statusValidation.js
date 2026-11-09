const { ValidationError } = require("../utils/errors");

const validateStatus = (allowedStatuses) => {
  return (req, res, next) => {
    const status = req.params.status;
    if (!allowedStatuses.includes(status)) {
      return next(new ValidationError("Invalid connection request status."));
    }
    next();
  };
};

module.exports = validateStatus;
