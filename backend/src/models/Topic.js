const mongoose = require("mongoose");

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: "" },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: "📘" },
  description: { type: String, default: "" },
  lessons: [LessonSchema]
}, { timestamps: true });

module.exports = mongoose.model("Topic", TopicSchema);
