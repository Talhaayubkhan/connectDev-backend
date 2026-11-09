module.exports = {
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/server.js"],
};
