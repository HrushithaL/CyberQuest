const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { registerUser, loginUser, getProfile, updateProfile, forgotPassword, verifyOtp, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Forgot Password Routes
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: process.env.FRONTEND_URL + "/login" }), (req, res) => {
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const safe = req.user.toObject();
  delete safe.password;
  res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}&user=${encodeURIComponent(JSON.stringify(safe))}`);
});

// GitHub OAuth routes
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get("/github/callback", passport.authenticate("github", { failureRedirect: process.env.FRONTEND_URL + "/login" }), (req, res) => {
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const safe = req.user.toObject();
  delete safe.password;
  res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}&user=${encodeURIComponent(JSON.stringify(safe))}`);
});

// Discord OAuth removed

module.exports = router;
