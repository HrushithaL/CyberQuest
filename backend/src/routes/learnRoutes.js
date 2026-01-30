const express = require("express");
const router = express.Router();
const learnController = require("../controllers/learnController");
const { protect } = require('../middleware/authMiddleware');

router.get("/topics", learnController.getAllTopics);
router.get("/topics/:id", learnController.getTopicById);
router.get("/roadmaps", learnController.getAllRoadmaps);

// Recommendations (public)
router.post("/recommend", learnController.recommendForRole);
// Generate multi-level roadmap (topic or role)
router.post("/generate", learnController.generateRoadmap);
// Assign roadmap to authenticated user
router.put("/assign-roadmap", protect, learnController.assignRoadmapToUser);
// Save a generated roadmap into DB and assign to the authenticated user
router.post("/save", protect, learnController.saveAndAssignRoadmap);
// Get current user's progress
router.get("/my-progress", protect, learnController.getMyProgress);
// Allow user to mark mission complete (quick unlock during guided roadmap)
router.post("/complete-mission", protect, learnController.completeMission);

// Generate a mission for a particular topic (on-demand by authenticated user)
router.post('/topics/:id/generate-mission', protect, learnController.generateMissionForTopic);

module.exports = router;
