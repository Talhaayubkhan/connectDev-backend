const { NotFoundError } = require("../utils/errors");

const notFound = (_req, _res, next) => {
  next(new NotFoundError("Route not found."));
};

module.exports = notFound;
