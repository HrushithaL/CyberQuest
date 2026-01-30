const User = require("../models/User");

exports.getProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("score level history badges");
    res.json(user);
  } catch (err) {
    console.error("getProgress error:", err.message || err);
    res.status(500).json({ message: "server error" });
  }
};
