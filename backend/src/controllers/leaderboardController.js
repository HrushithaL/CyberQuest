const User = require("../models/User");

exports.getLeaderboard = async (req, res) => {
  try {
    const top = await User.find().sort({ score: -1 }).limit(20).select("name score level");
    res.json(top);
  } catch (err) {
    console.error("getLeaderboard error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};
