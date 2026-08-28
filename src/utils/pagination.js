const { ValidationError } = require("./errors");

const parsePositiveInteger = (value, fallback, fieldName) => {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new ValidationError(`${fieldName} must be a positive integer.`);
  }
  return parsed;
};

const parsePagination = (
  query,
  { defaultLimit = 10, maxLimit = 50 } = {},
) => {
  const page = parsePositiveInteger(query?.page, 1, "Page");
  const limit = parsePositiveInteger(query?.limit, defaultLimit, "Limit");

  if (limit > maxLimit) {
    throw new ValidationError(`Limit cannot exceed ${maxLimit}.`);
  }

  return { page, limit, skip: (page - 1) * limit };
};

module.exports = { parsePagination };
