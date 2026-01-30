const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// FIX: import protect properly
const { protect } = require("../middleware/authMiddleware");

// FIX: import admin middleware properly
const { adminOnly } = require("../middleware/adminMiddleware");

// FIXED ROUTES
router.get("/users", protect, adminOnly, adminController.getAllUsers);
router.get("/reports", protect, adminOnly, adminController.getReports);

// Missions - user generated
router.get("/missions", protect, adminOnly, adminController.getUserGeneratedMissions);
router.get("/missions/creator/:id", protect, adminOnly, adminController.getMissionsByCreator);
router.patch("/missions/:id/review", protect, adminOnly, adminController.reviewMission);
router.get("/missions/:id/progress", protect, adminOnly, adminController.getMissionProgress);
router.delete("/missions/:id", protect, adminOnly, adminController.deleteMission);

// User progress
router.get("/users/:id/progress", protect, adminOnly, adminController.getUserProgress);

// System stats
router.get("/stats", protect, adminOnly, adminController.getStats);

// Missions management (user-submitted)
router.get("/missions", protect, adminOnly, adminController.getUserGeneratedMissions);
router.patch("/missions/:id/review", protect, adminOnly, adminController.reviewMission);
router.delete("/missions/:id", protect, adminOnly, adminController.deleteMission);

// User update/delete
router.patch("/users/:id", protect, adminOnly, adminController.updateUser);
router.delete("/users/:id", protect, adminOnly, adminController.deleteUser);

// Topics (learn content)
router.post("/topics", protect, adminOnly, adminController.createTopic);
router.patch("/topics/:id", protect, adminOnly, adminController.updateTopic);
router.delete("/topics/:id", protect, adminOnly, adminController.deleteTopic);
router.post("/topics/:id/lessons", protect, adminOnly, adminController.addLessonToTopic);
router.post("/topics/:id/generate-content", protect, adminOnly, adminController.generateTopicContent);
router.patch("/topics/:id/lessons/:lessonId", protect, adminOnly, adminController.updateLesson);
router.delete("/topics/:id/lessons/:lessonId", protect, adminOnly, adminController.deleteLesson);

// Roadmaps
router.post("/roadmaps", protect, adminOnly, adminController.createRoadmap);
router.patch("/roadmaps/:id", protect, adminOnly, adminController.updateRoadmap);
router.delete("/roadmaps/:id", protect, adminOnly, adminController.deleteRoadmap);

module.exports = router;
