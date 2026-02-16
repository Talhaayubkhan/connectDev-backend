const isAdminAuthCheck = (req, res, next) => {
  const token = "xyz";
  const isAdminAuthenticated = token === "xyz"; // Simulate authentication check
  if (!isAdminAuthenticated) {
    res.status(401).send({ message: "Unauthorized" }); // Send unauthorized response
  } else {
    next();
  }
};

module.exports = { isAdminAuthCheck };
