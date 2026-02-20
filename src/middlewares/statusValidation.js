const { ValidationError } = require("../utils/errors");

const validateStatus = (allowedStatuses) => {
  return (req, res, next) => {
    if (!allowedStatuses.includes(req.params.status)) {
      return next(new ValidationError("Invalid status"));
    }
    next();
  };
};

module.exports = validateStatus;
