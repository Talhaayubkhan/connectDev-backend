const app = require("./app");
const connectDB = require("./config/database");

connectDB()
  .then(() => {
    console.log("Database Connected Successfully!");
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Not Connected, Try Again!");
  });
