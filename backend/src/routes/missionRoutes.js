const express = require("express");
const router = express.Router();
const { Mission } = require("../models/Mission");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const missionController = require("../controllers/missionController");

// ---- OpenAI client (supports custom baseURL for OpenRouter/Ollama/etc.) ----
const OpenAI = require("openai").default;

// Lazy-load OpenAI client to ensure env vars are available
let client = null;
const getClient = () => {
  if (!client) {
    const baseURL = process.env.OPENAI_BASE_URL || undefined; // e.g., https://openrouter.ai/api/v1 or http://localhost:11434/v1
    const defaultHeaders = {};
    // Optional: OpenRouter recommended headers for attribution
    if (baseURL && /openrouter\.ai/i.test(baseURL)) {
      if (process.env.OPENROUTER_SITE_URL) defaultHeaders["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
      if (process.env.OPENROUTER_APP_NAME) defaultHeaders["X-Title"] = process.env.OPENROUTER_APP_NAME;
    }

    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL,
      defaultHeaders: Object.keys(defaultHeaders).length ? defaultHeaders : undefined,
    });
  }
  return client;
};

const { buildMissionPrompt } = require("../utils/prompt");
const { generateMockMission } = require("../utils/mockMissions");

// ---- XP BY DIFFICULTY ----
const calculatePoints = (difficulty) => ({
  easy: 100,
  medium: 200,
  hard: 300,
  expert: 500
}[difficulty] || 100);

/* =====================================================
   GENERATE MISSION (OPENAI with FALLBACK)
===================================================== */
router.post("/generate", protect, async (req, res) => {
  try {
    const { topic, difficulty, type, format, provider, model: modelOverride } = req.body || {};

    if (!topic || !difficulty || !type)
      return res.status(400).json({ message: "Missing fields" });

    const prompt = buildMissionPrompt(topic, type, difficulty, format);

    console.log("\n[AI PROMPT SENT] =====================\n");
    console.log(prompt);

    // Resolve model precedence: request override > env AI_MODEL > env AI_PROVIDER mapping > default
    const providerToModel = (prov) => {
      const p = (prov || '').toLowerCase();
      if (p === 'chatgpt-go') return 'gpt-4o-mini'; // OpenAI lightweight tier
      if (p === 'openai-mini') return 'gpt-4o-mini';
      if (p === 'gemini-flash') return 'google/gemini-1.5-flash'; // requires OpenRouter base URL
      if (p === 'perplexity') return 'pplx-70b-online'; // requires Perplexity base URL
      return null;
    };

    const resolvedModel = modelOverride
      || process.env.AI_MODEL
      || providerToModel(provider || process.env.AI_PROVIDER)
      || 'gpt-4o-mini';

    let content;
    try {
      const aiRes = await getClient().chat.completions.create({
        model: resolvedModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      });

      let raw = aiRes.choices[0].message.content.trim();

      console.log("\n[AI RAW RESPONSE] =====================\n");
      console.log(raw);

      /* -----------------------------------------
         JSON PARSE WITH FALLBACK
      ----------------------------------------- */
      try {
        content = JSON.parse(raw);
      } catch (err) {
        console.warn("\n[AI JSON PARSE FAILED] – trying fallback fix...\n");

        try {
          raw = raw.replace(/```json/g, "").replace(/```/g, "");
          content = JSON.parse(raw);
        } catch (err2) {
          console.error("AI returned invalid JSON:", raw);
          throw new Error("Invalid JSON from AI");
        }
      }
    } catch (aiErr) {
      console.warn("\n[OPENAI ERROR] - Using mock mission fallback =====================\n");
      console.warn("Error:", aiErr.message);

      // Use mock mission as fallback
      content = generateMockMission(topic, difficulty, type);
      console.log("Using mock mission:", content.title);
    }

    /* -----------------------------------------
       SAVE MISSION
    ----------------------------------------- */
    const mission = await Mission.create({
      title: content.title,
      description: content.description,
      difficulty,
      type,
      topic,
      points: content.points || calculatePoints(difficulty),
      content: {
        questions: content?.content?.questions || [],
        scenarios: content?.content?.scenarios || [],
        challenges: content?.content?.challenges || []
      },
      createdBy: req.user._id
    });

    console.log("\n[MISSION SAVED SUCCESSFULLY]\n");

    return res.status(201).json(mission);

  } catch (err) {
    console.error("\n[MISSION GENERATION ERROR] =====================\n", err);
    return res.status(500).json({ message: "Mission generation failed", error: err.message });
  }
});


/* =====================================================
   GET ALL MISSIONS WITH USER PROGRESS
===================================================== */
router.get("/", protect, missionController.getUserMissions);


/* =====================================================
   GET MISSION BY ID WITH PROGRESS
===================================================== */
router.get("/:id", protect, missionController.getMissionById);


/* =====================================================
   SUBMIT MISSION (MCQ, Scenario, Challenge)
   Delegate to controller.submitMission for consistent behavior
===================================================== */
router.post("/submit", protect, missionController.submitMission);

/* =====================================================
   AUTOSAVE ENDPOINT (Draft/save-in-progress)
===================================================== */
router.post("/autosave", protect, missionController.autosaveProgress);

/* =====================================================
   EVALUATE SINGLE CHALLENGE (CHECK SOLUTION)
   POST { missionId, challengeIndex, submission }
   Returns AI/deterministic verdict without awarding points
===================================================== */
router.post("/evaluate-challenge", protect, missionController.evaluateChallenge);

/* =====================================================
   VALIDATE SECTION (MCQ/SCENARIO)
   POST { missionId, type, answers }
   Returns validation results for immediate feedback
===================================================== */
router.post("/validate-section", protect, missionController.validateSection);


/* =====================================================
   SIMPLE COMPLETE FOR NON-MCQ MISSIONS
===================================================== */
router.post("/:id/complete", protect, async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: "Mission not found" });

    const user = await User.findById(req.user._id);

    const earned = mission.points || 100;

    user.score += earned;
    user.level = Math.floor(user.score / 1000) + 1;
    await user.save();

    res.json({
      message: "Mission completed",
      earnedPoints: earned,
      newScore: user.score,
      newLevel: user.level
    });

  } catch (err) {
    console.error("Complete error:", err);
    res.status(500).json({ message: "Failed to complete mission" });
  }
});

module.exports = router;
