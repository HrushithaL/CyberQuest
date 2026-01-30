const mongoose = require("mongoose");

const missionProgressSchema = new mongoose.Schema({
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: "Mission" },
  status: { type: String, enum: ["not-started", "in-progress", "completed"], default: "not-started" },
  answers: [mongoose.Schema.Types.Mixed], // Array of user answers (allow nulls and mixed types)
  challengeSolutions: mongoose.Schema.Types.Mixed, // Stores challenge code/solutions
  score: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date
});

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  missions: [missionProgressSchema],
  totalScore: { type: Number, default: 0 },
  lastPlayed: Date
}, { timestamps: true });

module.exports = mongoose.model("Progress", progressSchema);
