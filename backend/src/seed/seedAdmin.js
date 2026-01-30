require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const seed = async () => {
  try {
    await connectDB();
    const adminEmail = "admin@cybergame.com";
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log("Admin already exists");
      process.exit(0);
    }
    const hashed = await bcrypt.hash("Admin@123", 10);
    await User.create({
      name: "Administrator",
      email: adminEmail,
      password: hashed,
      role: "admin",
      score: 0
    });
    console.log("Admin seeded");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
