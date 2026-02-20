const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    console.log("Database Connected Successfully!");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Not Connected, Try Again!");
  });
