const Topic = require("../models/Topic");
const Roadmap = require("../models/Roadmap");

exports.getAllTopics = async (req, res) => {
  try {
    const topics = await Topic.find().lean();
    res.json(topics);
  } catch (err) {
    console.error("getAllTopics error:", err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

exports.getTopicById = async (req, res) => {
  try {
    const t = await Topic.findById(req.params.id).lean();
    if (!t) return res.status(404).json({ message: 'Topic not found' });
    res.json(t);
  } catch (err) {
    console.error("getTopicById error:", err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

exports.getAllRoadmaps = async (req, res) => {
  try {
    const roadmaps = await Roadmap.find().populate('topics', 'name icon').lean();
    res.json(roadmaps);
  } catch (err) {
    console.error("getAllRoadmaps error:", err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

// Recommend topics/roadmap based on role + skillLevel
exports.recommendForRole = async (req, res) => {
  try {
    const { role, skillLevel } = req.body;

    // Simple role -> topic mapping (can be extended or replaced by AI later)
    const roleMap = {
      analyst: ['Phishing', 'Network Security', 'Malware', 'Incident Response'],
      developer: ['Password Security', 'Secure Coding', 'Web Exploit', 'OWASP'],
      pentester: ['Web Exploit', 'Network Security', 'Social Engineering', 'Forensics'],
      beginner: ['Password Security', 'Phishing', 'Social Engineering']
    };

    const topicsForRole = roleMap[(role || '').toLowerCase()] || roleMap['beginner'];

    // Find topic documents that match these names
    const topics = await Topic.find({ name: { $in: topicsForRole } }).lean();

    // Compose a suggested roadmap (not saved yet)
    const roadmap = {
      name: `${role || 'Custom'} Roadmap`,
      description: `Generated roadmap for ${role || 'user'}`,
      duration: skillLevel === 'beginner' ? '4 weeks' : skillLevel === 'intermediate' ? '6 weeks' : '8 weeks',
      difficulty: skillLevel === 'beginner' ? 'beginner' : skillLevel === 'intermediate' ? 'intermediate' : 'advanced',
      topics: topics.map(t => ({ id: t._id, name: t.name }))
    };

    res.json({ topics, roadmap });
  } catch (err) {
    console.error('recommendForRole error:', err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

// -------------------- NEW: Generate multi-level roadmap --------------------
// Accepts: { role, topic, skillLevel }
// Returns a roadmap object broken into Level 1..5 with topic items per level
exports.generateRoadmap = async (req, res) => {
  try {
    const { role, topic, skillLevel } = req.body || {};

    // helper to map a topic string into progressive items
    const buildTopicLevels = (t) => {
      const base = t || 'Security';
      return [
        { level: 1, title: 'Beginner', items: [
            { name: `${base} fundamentals`, kind: 'concept' },
            { name: `Basic ${base} protocols`, kind: 'concept' },
            { name: `Intro to ${base} monitoring`, kind: 'skill' }
          ]
        },
        { level: 2, title: 'Intermediate', items: [
            { name: `${base} attack techniques`, kind: 'attack' },
            { name: `${base} detection methods`, kind: 'detection' },
            { name: `${base} hands-on labs`, kind: 'exercise' }
          ]
        },
        { level: 3, title: 'Advanced', items: [
            { name: `${base} response & forensics`, kind: 'skill' },
            { name: `${base} deep-dive scenarios`, kind: 'exercise' }
          ]
        },
        { level: 4, title: 'Expert', items: [
            { name: `Advanced ${base} techniques`, kind: 'expert' },
            { name: `${base} architecture & design`, kind: 'design' }
          ]
        },
        { level: 5, title: 'Leader', items: [
            { name: `${base} governance & policy`, kind: 'governance' },
            { name: `${base} team leadership`, kind: 'leadership' }
          ]
        }
      ];
    };

    // role-based maps (example; can be extended)
    const roleTemplates = {
      analyst: ['Security fundamentals','Network protocols','System monitoring','IDS/IPS','Malware analysis','SIEM','Incident response','Forensics','Threat intel','Security architecture','Policy & governance','Leadership'],
      pentester: ['Recon & scanning','Web vulnerabilities','Exploitation basics','Post-exploitation','Advanced web attacks','Network pivoting','Red team scenarios','Tooling & automation','Reporting & governance','Program leadership'],
      developer: ['Secure coding basics','Input validation','Authentication & sessions','OWASP Top10','Static analysis','Secure design patterns','Threat modeling','Security reviews','DevSecOps leadership']
    };

    let levels;

    if (topic) {
      // topic-based generation
      levels = buildTopicLevels(topic);
    } else if (role) {
      // role-based generation: try to split roleTemplates into levels
      const list = roleTemplates[(role || '').toLowerCase()] || roleTemplates['analyst'];
      // heuristic: split list into 5 buckets
      const perLevel = Math.ceil(list.length / 5);
      levels = [1,2,3,4,5].map((lvl, idx) => ({
        level: lvl,
        title: ["Beginner","Intermediate","Advanced","Expert","Leader"][lvl-1],
        items: list.slice(idx*perLevel, (idx+1)*perLevel).map(name => ({ name, kind: 'topic' }))
      }));
    } else {
      // default beginner roadmap on Security fundamentals
      levels = buildTopicLevels('Security');
    }

    // try to resolve topics in DB and attach topic ids and sample mission ids if present
    const topicNames = [];
    levels.forEach(l => l.items.forEach(i => topicNames.push(i.name)));
    const dbTopics = await Topic.find({ name: { $in: topicNames } }).lean();
    const { Mission } = require('../models/Mission');
    const roadmap = {
      name: role ? `${role} Roadmap` : (topic ? `${topic} Roadmap` : 'Security Roadmap'),
      description: role ? `Auto-generated roadmap for ${role}` : `Auto-generated roadmap for ${topic || 'Security'}`,
      levels: levels.map(l => ({
        level: l.level,
        title: l.title,
        items: l.items.map(it => {
          const dbt = dbTopics.find(dt => dt.name === it.name);
          return {
            name: it.name,
            kind: it.kind,
            topicId: dbt?._id || null,
            // attempt to find a published mission for this topic name
            missionId: null
          };
        })
      }))
    };

    // attach missionIds where possible
    for (const lvl of roadmap.levels) {
      for (const item of lvl.items) {
        if (item.topicId) {
          const m = await Mission.findOne({ topic: { $regex: new RegExp(item.name, 'i') }, isPublished: true });
          if (m) item.missionId = m._id;
        }
      }
    }

    res.json({ roadmap });
  } catch (err) {
    console.error('generateRoadmap error:', err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

// Return the progress doc for the authenticated user
exports.getMyProgress = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const Progress = require('../models/Progress');
    const progress = await Progress.findOne({ userId: req.user._id }).lean();
    res.json({ progress });
  } catch (err) {
    console.error('getMyProgress error:', err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

// Save an auto-generated roadmap and assign to the current user
exports.saveAndAssignRoadmap = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { name, description, levels } = req.body;
    if (!levels || !Array.isArray(levels)) return res.status(400).json({ message: 'levels required' });

    // collect unique topic names from levels
    const topicNames = new Set();
    levels.forEach(l => l.items && l.items.forEach(i => topicNames.add(i.name)));
    const TopicModel = require('../models/Topic');
    const topics = await TopicModel.find({ name: { $in: Array.from(topicNames) } });

    // create roadmap referencing found topics (if any)
    const RoadmapModel = require('../models/Roadmap');
    const roadmap = new RoadmapModel({
      name: name || 'Custom Roadmap',
      description: description || '',
      topics: topics.map(t => t._id),
      source: 'user',
      createdBy: req.user._id
    });
    await roadmap.save();

    // assign roadmap and ensure missions/progress similar to assignRoadmapToUser
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    user.activeRoadmap = roadmap._id;
    await user.save();

    // Ensure progress doc exists and create mission placeholders for any topic lacking missions
    const Progress = require('../models/Progress');
    let progress = await Progress.findOne({ userId: user._id });
    if (!progress) progress = await Progress.create({ userId: user._id, missions: [] });

    const { Mission } = require('../models/Mission');
    const { generateMockMission } = require('../utils/mockMissions');

    for (const t of topics) {
      let mission = await Mission.findOne({ topic: t.name, isPublished: true });
      if (!mission) {
        const mock = generateMockMission(t.name, 'easy', 'mcq');
        mission = await Mission.create({
          title: mock.title,
          description: mock.description,
          difficulty: 'easy',
          type: 'mcq',
          topic: t.name,
          points: mock.points || 100,
          content: {
            questions: mock.content?.questions || [],
            scenarios: mock.content?.scenarios || [],
            challenges: mock.content?.challenges || []
          },
          isPublished: true
        });
      }

      const exists = progress.missions.some(m => m.missionId.toString() === mission._id.toString());
      if (!exists) progress.missions.push({ missionId: mission._id, status: 'not-started', score: 0 });
    }

    await progress.save();

    res.json({ message: 'Roadmap saved and assigned', roadmap });
  } catch (err) {
    console.error('saveAndAssignRoadmap error:', err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};

// Mark a mission as completed for user (quick action to mark progress, score optional)
exports.completeMission = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { missionId, score = 0 } = req.body;
    if (!missionId) return res.status(400).json({ message: 'missionId required' });

    const Progress = require('../models/Progress');
    const { Mission } = require('../models/Mission');
    const mission = await Mission.findById(missionId).lean();
    const progress = await Progress.findOne({ userId: req.user._id });
    if (!progress) return res.status(404).json({ message: 'progress not found' });

    let mp = progress.missions.find(m => m.missionId.toString() === missionId.toString());
    if (!mp) {
      mp = { missionId, status: 'completed', score };
      progress.missions.push(mp);
    } else {
      mp.status = 'completed';
      mp.score = score;
      mp.completedAt = new Date();
    }

    await progress.save();

    // update user's overall score
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    user.score = (user.score || 0) + (score || mission?.points || 0);
    await user.save();

    res.json({ message: 'Mission marked complete', missionId });
  } catch (err) {
    console.error('completeMission error:', err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};


// ---------------- NEW: Generate a mission for a specific topic ----------------
// Authenticated users can request a starter mission for a topic (creates published mission and adds a placeholder to their Progress)
exports.generateMissionForTopic = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    const { id } = req.params; // topic id

    const topic = await Topic.findById(id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    const { generateMockMission } = require('../utils/mockMissions');
    const { Mission } = require('../models/Mission');

    const mock = generateMockMission(topic.name, 'easy', 'mcq');
    const mission = await Mission.create({
      title: mock.title,
      description: mock.description,
      difficulty: 'easy',
      type: 'mcq',
      topic: topic.name,
      points: mock.points || 100,
      content: {
        questions: mock.content?.questions || [],
        scenarios: mock.content?.scenarios || [],
        challenges: mock.content?.challenges || []
      },
      isPublished: true
    });

    // Ensure user's progress document includes this mission as a placeholder
    const Progress = require('../models/Progress');
    let progress = await Progress.findOne({ userId: req.user._id });
    if (!progress) progress = await Progress.create({ userId: req.user._id, missions: [] });

    const exists = progress.missions.some(m => String(m.missionId) === String(mission._id));
    if (!exists) {
      progress.missions.push({ missionId: mission._id, status: 'not-started', score: 0 });
      await progress.save();
    }

    res.json({ topic, mission });
  } catch (err) {
    console.error('generateMissionForTopic error:', err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};


// Assign a roadmap to the authenticated user (store reference in user.activeRoadmap)
// Additionally: ensure there are missions for each topic in the roadmap and create
// progress placeholders for the user (so progress shown is real, not fabricated)
exports.assignRoadmapToUser = async (req, res) => {
  try {
    const { roadmapId } = req.body;
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const rm = await Roadmap.findById(roadmapId).populate('topics').lean();
    if (!rm) return res.status(404).json({ message: 'Roadmap not found' });

    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    user.activeRoadmap = rm._id;
    await user.save();

    // Ensure progress doc exists
    const Progress = require('../models/Progress');
    let progress = await Progress.findOne({ userId: user._id });
    if (!progress) progress = await Progress.create({ userId: user._id, missions: [] });

    // For each topic in roadmap, ensure at least one mission exists and add it to user's progress if missing
    const { generateMockMission } = require('../utils/mockMissions');
    const { Mission } = require('../models/Mission');

    const createdOrLinkedMissions = [];

    for (const t of rm.topics) {
      // try to find an existing published mission for this topic
      let mission = await Mission.findOne({ topic: t.name, isPublished: true });

      if (!mission) {
        // create a simple mission using mock generator (easy/mcq by default)
        const mock = generateMockMission(t.name, 'easy', 'mcq');
        mission = await Mission.create({
          title: mock.title,
          description: mock.description,
          difficulty: 'easy',
          type: 'mcq',
          topic: t.name,
          points: mock.points || 100,
          content: {
            questions: mock.content?.questions || [],
            scenarios: mock.content?.scenarios || [],
            challenges: mock.content?.challenges || []
          },
          isPublished: true
        });
      }

      createdOrLinkedMissions.push(mission);

      // Add mission placeholder to user's progress if not present
      const exists = progress.missions.some(m => m.missionId.toString() === mission._id.toString());
      if (!exists) {
        progress.missions.push({ missionId: mission._id, status: 'not-started', score: 0 });
      }
    }

    await progress.save();

    res.json({ message: 'Roadmap assigned', roadmap: rm, missions: createdOrLinkedMissions.map(m => m._id) });
  } catch (err) {
    console.error('assignRoadmapToUser error:', err.message || err);
    res.status(500).json({ message: 'server error' });
  }
};
