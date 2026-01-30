const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: Number, required: true },
  hint: String,
  explanation: String,
  image: String
});

const ScenarioSchema = new mongoose.Schema({
  title: String,
  sender: String,
  subject: String,
  content: String,
  options: [String],
  answer: Number,
  hint: String,
  explanation: String
});

const ChallengeSchema = new mongoose.Schema({
  title: String,
  description: String,
  code: String,
  language: String,
  hints: [String],
  guide: String,
  inputFields: [{
    name: String,
    label: String,
    type: { type: String, default: 'text' },
    placeholder: String
  }],
  // Validation fields
  expected: String,  // Simple expected answer (legacy)
  officialAnswer: String,  // AI-generated official answer
  correctSolution: mongoose.Schema.Types.Mixed,  // Canonical solution (can be string, array, object)
  testCases: [{
    input: String,
    output: String
  }],
  // Metadata for tracking
  officialAnswerGeneratedBy: String,
  officialAnswerGeneratedAt: Date
});

// UserProgress Schema for tracking mission completion
const UserProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  missionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mission",
    required: true
  },
  status: {
    type: String,
    enum: ["not-started", "in-progress", "completed"],
    default: "not-started"
  },
  answers: [mongoose.Schema.Types.Mixed],  // Stores user's answers
  challengeSolutions: mongoose.Schema.Types.Mixed,  // Stores challenge code/solutions
  score: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  timeTaken: { type: Number, default: 0 },  // in seconds
  mistakes: { type: Number, default: 0 },
  hintsUsed: { type: Number, default: 0 }
}, { timestamps: true });

const MissionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },

    topic: { type: String, required: true },     
    type: { type: String, required: true },      
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert"],
      default: "easy"
    },

    points: { type: Number, default: 20 },

    // MAIN PLAY CONTENT
    content: {
      questions: [QuestionSchema],    // MCQ missions
      scenarios: [ScenarioSchema],    // Email phishing or story cases
      challenges: [ChallengeSchema]   // code/network/forensics challenges
    },

    
    aiFallback: { type: Boolean, default: false },
    // Admin review/publish
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    
    // Format/Type indicator
    format: String,  // mcq, scenario, challenge, puzzle

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    }
  },
  { timestamps: true }
);

/* ======================================================
   VIRTUALS FOR FRONTEND COMPATIBILITY
====================================================== */

// Count all possible question-like elements
MissionSchema.virtual("totalItems").get(function () {
  return (
    (this.content?.questions?.length || 0) +
    (this.content?.scenarios?.length || 0) +
    (this.content?.challenges?.length || 0)
  );
});

// Expose mission ID as id instead of _id
MissionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

MissionSchema.set("toJSON", { virtuals: true, transform: (doc, ret) => {
  try {
    if (ret && ret.content && Array.isArray(ret.content.challenges)) {
      ret.content.challenges = ret.content.challenges.map(ch => {
        if (ch && typeof ch === 'object') {
          // Hide correctSolution from API responses
          delete ch.correctSolution;
        }
        return ch;
      });
    }
  } catch (_) {}
  return ret;
} });
MissionSchema.set("toObject", { virtuals: true, transform: (doc, ret) => {
  try {
    if (ret && ret.content && Array.isArray(ret.content.challenges)) {
      ret.content.challenges = ret.content.challenges.map(ch => {
        if (ch && typeof ch === 'object') {
          // Hide correctSolution when converting to plain object
          delete ch.correctSolution;
        }
        return ch;
      });
    }
  } catch (_) {}
  return ret;
} });

// Create separate model for UserProgress
const UserProgressModel = mongoose.model("UserProgress", UserProgressSchema);

module.exports = {
  Mission: mongoose.model("Mission", MissionSchema),
  UserProgress: UserProgressModel
};