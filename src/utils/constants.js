const SENDER_FIELDS = [
  "firstName",
  "lastName",
  "photoURL",
  "age",
  "gender",
  "about",
  "skills",
  "location",
  "occupation",
  "lastSeen",
  "createdAt",
  "updatedAt",
];

const COMMON_PASSWORDS = new Set([
  "123456",
  "password",
  "123456789",
  "qwerty",
  "abc123",
  "password123",
]);

const PASSWORD_RULES = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

module.exports = {
  SENDER_FIELDS,
  COMMON_PASSWORDS,
  PASSWORD_RULES,
};
