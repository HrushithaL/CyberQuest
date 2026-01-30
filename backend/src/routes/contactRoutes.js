const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public route - anyone can submit, but optionally save userId if logged in
router.post("/submit", optionalAuth, contactController.submitContactMessage);

// User route - get own messages (requires authentication)
router.get("/my-messages", protect, contactController.getUserMessages);

// Admin-only routes
router.get("/messages", protect, adminOnly, contactController.getAllContactMessages);
router.get("/messages/unread-count", protect, adminOnly, contactController.getUnreadCount);
router.get("/messages/:id", protect, adminOnly, contactController.getContactMessageById);
router.patch("/messages/:id/status", protect, adminOnly, contactController.updateMessageStatus);
router.post("/messages/:id/reply", protect, adminOnly, contactController.replyToMessage);
router.delete("/messages/:id", protect, adminOnly, contactController.deleteContactMessage);

module.exports = router;
