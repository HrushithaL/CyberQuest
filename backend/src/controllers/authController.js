const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, skillLevel } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email/password required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: role || "user", skillLevel: skillLevel || 'beginner' });
    // Create JWT token and return user object without password for auto login
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const safe = user.toObject();
    delete safe.password;
    res.status(201).json({ message: "registered", token, user: safe });
  } catch (err) {
    console.error("registerUser error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    const safe = user.toObject();
    delete safe.password;
    res.json({ token, user: safe });
  } catch (err) {
    console.error("loginUser error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

// Get profile for currently authenticated user
exports.getProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    res.json(req.user);
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
};

// Update profile for current user
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const { name, email, skillLevel } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (name) user.name = name;
    if (email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }
    if (skillLevel) user.skillLevel = skillLevel;
    await user.save();
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (err) {
    console.error("updateProfile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user (in production, use actual email service)
    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    await user.save();

    // TODO: Send email with OTP using nodemailer or similar service
    // For now, log to console (in production, use actual email service)
    console.log(`OTP for ${email}: ${otp}`);

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("forgotPassword error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP exists and is not expired
    if (!user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ message: "No OTP request found. Please request a new OTP." });
    }

    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("verifyOtp error:", err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP again
    if (user.resetOtp !== otp || user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Check password length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
