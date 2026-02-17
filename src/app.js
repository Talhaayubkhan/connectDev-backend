const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const User = require("./models/userSchema");
const { validateSignupData } = require("./utils/validation");

app.use(express.json());

app.post("/signUp", async (req, res) => {
  try {
    // 1. Validate input
    validateSignupData(req.body);

    const { firstName, lastName, email, password } = req.body;

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user object
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // 5. Save to database
    await user.save();

    // 6. Send safe response (never send password)
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (err) {
    // Better error handling
    res.status(400).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    // 3. Find user (only select needed fields)
    const user = await User.findOne({ email: email });

    // 4. Check user existence
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 5. Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 6. Send success response
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send("Something went wrong!");
  }
});

app.delete("/user", async (req, res) => {
  const userId = req.body.userId;
  // console.log(userId);

  try {
    const user = await User.findOneAndDelete(userId);
    res.send("user deleted successfully!");
  } catch (error) {
    res.status(400).send("Something went wrong!");
  }
});

app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const userData = req.body;

  try {
    const ISALLOWEDUPDATE = ["skills", "about", "age", "photoURL", "gender"];

    const checkUpdate = Object.keys(userData).every((k) => {
      return ISALLOWEDUPDATE.includes(k);
    });

    if (!checkUpdate) {
      throw new Error("Not allowed the updates!");
    }

    const user = await User.findByIdAndUpdate(userId, userData, {
      runValidators: true,
      returnDocument: "after",
    });

    res.send("User updated successfully!");
  } catch (error) {
    res.status(400).send("Update Failed!" + error.message);
  }
});

module.exports = app;
