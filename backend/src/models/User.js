const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, default: "User" },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user","admin"], default: "user" },
  skillLevel: { type: String, enum: ["beginner","intermediate","advanced","expert"], default: "beginner" },
  score: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: { type: [String], default: [] },
  history: [
    {
      missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission" },
      score: Number,
      difficulty: String,
      date: { type: Date, default: Date.now }
    }
  ],
  activeRoadmap: { type: mongoose.Schema.Types.ObjectId, ref: 'Roadmap', default: null },
  oauthProvider: { type: String, enum: ["google", "github", null], default: null },
  oauthId: { type: String, default: null },
  // Forgot Password Fields
  resetOtp: { type: String, default: null },
  resetOtpExpiry: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
