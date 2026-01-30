const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Named export: protect - requires authentication
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "No token provided" });

    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Invalid token" });

    req.user = user;
    next();

  } catch (err) {
    console.error("Auth Error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Optional auth - tries to authenticate but doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) {
      req.user = null;
      return next();
    }

    const token = header.split(" ")[1];
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    req.user = user || null;
    next();

  } catch (err) {
    // Token invalid but that's ok for optional auth
    req.user = null;
    next();
  }
};

module.exports = { protect, optionalAuth };
