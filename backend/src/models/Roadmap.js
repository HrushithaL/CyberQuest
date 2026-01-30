const mongoose = require("mongoose");

const RoadmapSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  duration: { type: String, default: "" },
  difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  topics: [{ type: mongoose.Schema.Types.ObjectId, ref: "Topic" }],
  // track whether roadmap was created by an admin, a user (generated+saved), or system
  source: { type: String, enum: ['admin', 'user', 'system'], default: 'admin' },
  // when created by a user, reference which user saved it
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model("Roadmap", RoadmapSchema);
