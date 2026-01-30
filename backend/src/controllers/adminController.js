const { Mission } = require("../models/Mission");
const User = require("../models/User");
const Topic = require("../models/Topic");
const Roadmap = require("../models/Roadmap");
const Progress = require("../models/Progress");

exports.getAllUsers = async (req, res) => {
  try {
    // Exclude admin accounts from the user list shown in dashboard
    const users = await User.find({ role: { $ne: 'admin' } }).select("-password");
    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.getReports = async (req, res) => {
  try {
    // Exclude admin accounts from reports returned to dashboard
    const users = await User.find({ role: { $ne: 'admin' } }).select("name email score level history badges");
    res.json({ totalUsers: users.length, users });
  } catch (err) {
    console.error("getReports error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

// System stats used by admin dashboard
exports.getStats = async (req, res) => {
  try {
    // Exclude admin accounts from public dashboard statistics
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalMissions = await Mission.countDocuments();
    const publishedMissions = await Mission.countDocuments({ isPublished: true });
    const totalTopics = await Topic.countDocuments();
    const totalRoadmaps = await Roadmap.countDocuments();

    const avgObj = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      { $group: { _id: null, avgScore: { $avg: "$score" } } }
    ]);

    const avgUserScore = (avgObj[0]?.avgScore) || 0;

    const topUsers = await User.find({ role: { $ne: 'admin' } }).sort({ score: -1 }).limit(5).select("name score");

    res.json({ totalUsers, totalMissions, publishedMissions, totalTopics, totalRoadmaps, avgUserScore, topUsers });
  } catch (err) {
    console.error("getStats error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

// User-generated missions
exports.getUserGeneratedMissions = async (req, res) => {
  try {
    const missions = await Mission.find({ createdBy: { $exists: true, $ne: null } }).populate('createdBy', 'name').lean();
    res.json(missions);
  } catch (err) {
    console.error("getUserGeneratedMissions error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

// Get missions for a specific creator
exports.getMissionsByCreator = async (req, res) => {
  try {
    const { id } = req.params;
    const missions = await Mission.find({ createdBy: id }).populate('createdBy', 'name email').lean();
    res.json(missions);
  } catch (err) {
    console.error("getMissionsByCreator error:", err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

// Get progress entries for a mission (list of users and their status/score)
exports.getMissionProgress = async (req, res) => {
  try {
    const { id } = req.params; // mission id
    // Find all users' progress documents that reference this mission
    const progresses = await Progress.find({ 'missions.missionId': id }).populate('userId', 'name email').lean();

    // Extract entries with mission info and user
    const entries = [];
    progresses.forEach(p => {
      const m = p.missions.find(x => x.missionId.toString() === id.toString());
      if (m) {
        entries.push({ user: p.userId, status: m.status, score: m.score || 0, completedAt: m.completedAt || null });
      }
    });

    res.json(entries);
  } catch (err) {
    console.error("getMissionProgress error:", err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

// Get user progress summary (all missions)
exports.getUserProgress = async (req, res) => {
  try {
    const { id } = req.params; // user id
    const progress = await Progress.findOne({ userId: id }).populate('missions.missionId', 'title difficulty').lean();
    if (!progress) return res.json({ missions: [] });
    res.json(progress);
  } catch (err) {
    console.error("getUserProgress error:", err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

// Review (approve/reject) a mission
exports.reviewMission = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    const mission = await Mission.findById(id);
    if (!mission) return res.status(404).json({ message: 'Mission not found' });
    mission.isPublished = !!isApproved;
    mission.publishedAt = isApproved ? new Date() : null;
    await mission.save();
    res.json({ message: 'Mission updated', mission });
  } catch (err) {
    console.error("reviewMission error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.deleteMission = async (req, res) => {
  try {
    const { id } = req.params;
    await Mission.findByIdAndDelete(id);
    res.json({ message: 'Mission deleted' });
  } catch (err) {
    console.error("deleteMission error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

// Admin update/delete user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = (({ name, skillLevel, score, level }) => ({ name, skillLevel, score, level }))(req.body);
    const user = await User.findByIdAndUpdate(id, allowed, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error("updateUser error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error("deleteUser error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

// Topics CRUD
exports.createTopic = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const t = new Topic({ name, icon, description });
    await t.save();
    res.status(201).json(t);
  } catch (err) {
    console.error("createTopic error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findByIdAndUpdate(id, req.body, { new: true });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (err) {
    console.error("updateTopic error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    await Topic.findByIdAndDelete(id);
    res.json({ message: 'Topic deleted' });
  } catch (err) {
    console.error("deleteTopic error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.addLessonToTopic = async (req, res) => {
  try {
    const { id } = req.params; // topic id
    const { title, content, order } = req.body;
    const topic = await Topic.findById(id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    topic.lessons.push({ title, content, order });
    await topic.save();
    res.status(201).json(topic);
  } catch (err) {
    console.error("addLessonToTopic error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

// Auto-generate lessons + a starter mission for a topic (admin-only)
exports.generateTopicContent = async (req, res) => {
  try {
    const { id } = req.params; // topic id
    const topic = await Topic.findById(id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    // Simple generation logic using mock generator - creates 2 lessons and a mission
    const { generateMockMission } = require('../utils/mockMissions');

    // create two lessons
    const lessons = [
      {
        title: `${topic.name} — Basics`,
        content: `Introduction to ${topic.name}: ${topic.description || ''}`,
        order: (topic.lessons?.length || 0) + 1
      },
      {
        title: `${topic.name} — Practice & Examples`,
        content: `Hands-on examples and scenarios for ${topic.name}.`,
        order: (topic.lessons?.length || 0) + 2
      }
    ];

    topic.lessons.push(...lessons);
    await topic.save();

    // Create a starter mission for the topic
    const mockMission = generateMockMission(topic.name, 'easy', 'mcq');
    const { Mission } = require('../models/Mission');
    const mission = await Mission.create({
      title: mockMission.title,
      description: mockMission.description,
      difficulty: 'easy',
      type: 'mcq',
      topic: topic.name,
      points: mockMission.points || 100,
      content: {
        questions: mockMission.content?.questions || [],
        scenarios: mockMission.content?.scenarios || [],
        challenges: mockMission.content?.challenges || []
      },
      isPublished: true
    });

    res.json({ topic, createdMission: mission });
  } catch (err) {
    console.error("generateTopicContent error:", err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const topic = await Topic.findById(id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    const lesson = topic.lessons.id(lessonId);
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    lesson.set(req.body);
    await topic.save();
    res.json(topic);
  } catch (err) {
    console.error("updateLesson error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const topic = await Topic.findById(id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    topic.lessons.id(lessonId).remove();
    await topic.save();
    res.json(topic);
  } catch (err) {
    console.error("deleteLesson error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

// Roadmaps CRUD
exports.createRoadmap = async (req, res) => {
  try {
    const r = new Roadmap(req.body);
    await r.save();
    res.status(201).json(r);
  } catch (err) {
    console.error("createRoadmap error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.updateRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    const roadmap = await Roadmap.findByIdAndUpdate(id, req.body, { new: true });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });
    res.json(roadmap);
  } catch (err) {
    console.error("updateRoadmap error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};

exports.deleteRoadmap = async (req, res) => {
  try {
    const { id } = req.params;
    await Roadmap.findByIdAndDelete(id);
    res.json({ message: 'Roadmap deleted' });
  } catch (err) {
    console.error("deleteRoadmap error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};
