require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const missionRoutes = require("./routes/missionRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const progressRoutes = require("./routes/progressRoutes");
const adminRoutes = require("./routes/adminRoutes");
const learnRoutes = require("./routes/learnRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || "your_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect MongoDB
connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/learn", learnRoutes);
app.use("/api/contact", contactRoutes);

app.get("/", (req, res) =>
  res.json({ message: "Cyber Gamified Backend running" })
);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`🚀 Backend server running on port ${PORT}`)
);

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Kill the process using the port or set a different PORT in your .env file.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
