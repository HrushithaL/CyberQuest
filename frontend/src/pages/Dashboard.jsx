  import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
  import { Link, useNavigate, useSearchParams } from "react-router-dom";
  import { AuthContext } from "../context/AuthContext";
import { apiGetMissions, apiGetUserProfile } from "../utils/api";
  import Navbar from '../components/Navbar.jsx';
  import './Dashboard.css';

  export default function Dashboard() {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [missions, setMissions] = useState([]);
    const [missionFilter, setMissionFilter] = useState('all');
    const filteredMissions = useMemo(() => {
      return (missions || []).filter(m => {
        const status = m?.userProgress?.status || 'not-started';
        if (missionFilter === 'completed') return status === 'completed';
        if (missionFilter === 'in-progress') return status === 'in-progress';
        return true;
      });
    }, [missions, missionFilter]);

    const [loading, setLoading] = useState(true);
    const [recentMissions, setRecentMissions] = useState([]);
    const [userStats, setUserStats] = useState({
      totalMissions: 0,
      completedMissions: 0,
      avgAccuracy: 0,
      xpGainedThisWeek: 0,
    });
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const dropsRef = useRef(null);

    useEffect(() => {
      // Handle OAuth callback
      const token = searchParams.get("token");
      const userStr = searchParams.get("user");
      if (token && userStr) {
        try {
          const userData = JSON.parse(decodeURIComponent(userStr));
          login(userData, token);
          navigate("/dashboard", { replace: true });
        } catch (err) {
          console.error("Failed to parse OAuth user data:", err);
        }
      }
    }, [searchParams, login, navigate]);

    useEffect(() => {
      (async () => {
        try {
          setLoading(true);
          // Load missions
          const m = await apiGetMissions();
          setMissions(m);

          // Load user profile for detailed stats
          const profile = await apiGetUserProfile();
          if (profile) {
            // Calculate stats
            const completed = m.filter(mm => mm.userProgress?.status === "completed").length;

            // Compute accuracy across missions where we have answers and questions
            let totalQuestions = 0;
            let totalCorrect = 0;
            m.forEach((mm) => {
              const questions = (mm.content?.questions || mm.questions || []).filter(Boolean);
              const answers = mm.userProgress?.answers || [];
              if (!questions || questions.length === 0 || !answers || answers.length === 0) return;
              questions.forEach((q, i) => {
                if (answers[i] === undefined) return;
                // determine canonical correct answer index/value
                const correctIndex = typeof q.answer === 'number' ? q.answer : (typeof q.answerIndex === 'number' ? q.answerIndex : null);
                if (correctIndex !== null) {
                  if (answers[i] === correctIndex) totalCorrect++;
                } else if (q.answer !== undefined) {
                  // compare values/strings
                  if (String(answers[i]).trim() === String(q.answer).trim()) totalCorrect++;
                }
                totalQuestions++;
              });
            });

            const computedAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : (profile.accuracy || 0);

            setUserStats({
              totalMissions: m.length,
              completedMissions: completed,
              avgAccuracy: computedAccuracy,
              xpGainedThisWeek: profile.xpThisWeek || 0,
            });
          }

          // Get recent missions (completed or in-progress)
          const recent = m
            .filter(mm => mm.userProgress?.status)
            .sort((a, b) => new Date(b.userProgress?.updatedAt || 0) - new Date(a.userProgress?.updatedAt || 0))
            .slice(0, 5);
          setRecentMissions(recent);
        } catch (err) {
          console.error("Dashboard Load Error:", err);
        } finally {
          setLoading(false);
        }
      })();
    }, []);

    // Set document title for this page
    useEffect(() => {
      const prevTitle = document.title;
      document.title = 'CyberQuest - Dashboard';
      return () => { document.title = prevTitle; };
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: true });
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const chars = "01#@!$%^&*(){}[]<>+-*/=?~`|\\;:,'\"./HACK_CYBER_SECURITY_ATTACK_DEFENSE_EXPLOIT_PAYLOAD";
      const fontSize = 14;
      const columns = Math.floor(canvas.width / fontSize);
      
      // Initialize drops only once
      if (!dropsRef.current) {
        dropsRef.current = Array(columns).fill(1);
      }
      const drops = dropsRef.current;

      function drawMatrix() {
        // Clear canvas completely without fade for stable animation
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ff88";
        ctx.font = `${fontSize}px monospace`;
        ctx.globalAlpha = 0.8;

        for (let i = 0; i < drops.length; i++) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);
          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
        ctx.globalAlpha = 1;
      }

      // Use requestAnimationFrame for smoother animation
      function animate() {
        drawMatrix();
        intervalRef.current = requestAnimationFrame(animate);
      }
      
      animate();

      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Reinitialize drops for new column count
        const newColumns = Math.floor(canvas.width / fontSize);
        dropsRef.current = Array(newColumns).fill(1);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        if (intervalRef.current) {
          cancelAnimationFrame(intervalRef.current);
        }
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    const getDifficultyColor = (difficulty) => {
      const d = difficulty?.toLowerCase() || '';
      if (d === "easy") return "#00ff88";
      if (d === "medium") return "#00d4ff";
      if (d === "hard") return "#ffa500";
      if (d === "expert") return "#ff0080";
      return "#fff";
    };

    const getDifficultyBg = (difficulty) => {
      const d = difficulty?.toLowerCase() || '';
      if (d === "easy") return "rgba(0, 255, 136, 0.1)";
      if (d === "medium") return "rgba(0, 212, 255, 0.1)";
      if (d === "hard") return "rgba(255, 165, 0, 0.1)";
      if (d === "expert") return "rgba(255, 0, 128, 0.1)";
      return "rgba(255, 255, 255, 0.1)";
    };

    const calculateXPProgress = () => {
      const level = user?.level || 1;
      const currentXP = user?.score || 0;
      const xpProgress = (currentXP % 1000) || 0;
      return {
        current: xpProgress,
        total: 1000,
        percentage: (xpProgress / 1000) * 100
      };
    };

    const xpData = calculateXPProgress();

    if (loading) {
      return (
        <>
          <Navbar />
          <div className="dashboard-container loading">
            <div className="spinner">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <p>Loading your dashboard...</p>
          </div>
        </>
      );
    }

    return (
      <>
        <Navbar />
        <canvas ref={canvasRef} style={{ position: "fixed", top: 0, left: 0, zIndex: -1 }}></canvas>
        
        <div className="dashboard-container">
          {/* HEADER SECTION */}
          <div className="dashboard-header">
            <div className="header-content">
              <div className="dashboard-title-brand">
                <img src="/logo.svg" alt="CyberQuest logo" className="dashboard-logo" />
                <h1>Welcome back, <span className="username">{user?.username || user?.name || "User"}</span>!</h1>
              </div>
              <p className="subheader">Your cyber security training dashboard</p>
            </div>
            <div className="header-actions">
              <Link to="/missions" className="btn-action primary-action">
                <i className="fas fa-play"></i> Start Mission
              </Link>
              {recentMissions.length > 0 && (
                <Link to={`/mission/${recentMissions[0]._id}`} className="btn-action secondary-action">
                  <i className="fas fa-arrow-right"></i> Continue Learning
                </Link>
              )}
            </div>
          </div>

          {/* OVERVIEW CARDS */}
          <div className="overview-section">
            <h2 className="section-title">Your Overview</h2>
            <div className="stats-grid">
              {/* Total XP Card */}
              <div className="stat-card total-xp">
                <div className="stat-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="stat-content">
                  <h3>Total XP</h3>
                  <p className="stat-value">{(user?.score || 0).toLocaleString()}</p>
                  <p className="stat-label">Points earned</p>
                </div>
              </div>

              {/* Level Card */}
              <div className="stat-card level-card">
                <div className="stat-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="stat-content">
                  <h3>Current Level</h3>
                  <p className="stat-value">{user?.level || 1}</p>
                  <div className="xp-progress-bar">
                    <div className="progress-fill" style={{ width: `${xpData.percentage}%` }}></div>
                  </div>
                  <p className="stat-label">{xpData.current} / 1000 XP</p>
                </div>
              </div>

              {/* Missions Completed Card */}
              <div className="stat-card missions-card">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <h3>Missions Complete</h3>
                  <p className="stat-value">{userStats.completedMissions}/{userStats.totalMissions}</p>
                  <p className="stat-label">
                    {userStats.totalMissions > 0 
                      ? Math.round((userStats.completedMissions / userStats.totalMissions) * 100)
                      : 0}% progress
                  </p>
                </div>
              </div>

              {/* Accuracy Card */}
              <div className="stat-card accuracy-card">
                <div className="stat-icon">
                  <i className="fas fa-bullseye"></i>
                </div>
                <div className="stat-content">
                  <h3>Accuracy Rate</h3>
                  <p className="stat-value">{userStats.avgAccuracy || 0}%</p>
                  <p className="stat-label">Overall performance</p>
                </div>
              </div>
            </div>
          </div>

          {/* RANK SUMMARY AND BADGES */}
          <div className="rank-section">
            <div className="rank-card">
              <h3 className="card-title">
                <i className="fas fa-crown"></i> Your Rank
              </h3>
              <div className="rank-content">
                <div className="rank-display">
                  <span className="rank-number">#{user?.rank || "—"}</span>
                  <span className="rank-text">on Global Leaderboard</span>
                </div>
                <Link to="/leaderboard" className="view-leaderboard-link">
                  View All Rankings <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </div>

              <div className="badges-card">
              <h3 className="card-title">
                <i className="fas fa-medal"></i> Badges Earned ({user?.badges?.length || 0})
              </h3>
              <div className="badges-container">
                {user?.badges?.length > 0 ? (
                  // show more badges and a view link
                  <>
                    {user.badges.slice(0, 10).map((badge, idx) => (
                      <div key={idx} className="badge-item" title={badge}>
                        <i className="fas fa-medal"></i>
                        <span className="badge-name">{badge}</span>
                      </div>
                    ))}
                    {user.badges.length > 10 && (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                        <a href="/profile" className="view-all-link">View all badges</a>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="no-badges">Start missions to earn badges</p>
                )}
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="activity-section">
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-container">
              {recentMissions.length > 0 ? (
                <div className="activity-list">
                  {recentMissions.map((mission) => (
                    <div key={mission._id} className="activity-item">
                      <div className="activity-icon">
                        <i className={`fas ${mission.userProgress?.status === 'completed' ? 'fa-check-circle' : 'fa-hourglass-half'}`}></i>
                      </div>
                      <div className="activity-details">
                        <h4>{mission.title}</h4>
                        <p className="activity-meta">
                          <span className="topic">{mission.topic}</span>
                          <span 
                            className="difficulty"
                            style={{ 
                              color: getDifficultyColor(mission.difficulty),
                              background: getDifficultyBg(mission.difficulty)
                            }}
                          >
                            {mission.difficulty}
                          </span>
                        </p>
                        <p className="activity-status">
                          {mission.userProgress?.status === 'completed' 
                            ? `Completed • ${mission.userProgress?.score || 0} XP`
                            : 'In Progress'}
                        </p>
                      </div>
                      <Link 
                        to={`/mission/${mission._id}`}
                        className="activity-action"
                      >
                        {mission.userProgress?.status === 'completed' ? 'Review' : 'Continue'}
                        <i className="fas fa-arrow-right"></i>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-inbox"></i>
                  <p>No recent activity. Start a mission to get going!</p>
                  <Link to="/missions" className="btn-action primary-action">
                    <i className="fas fa-play"></i> Explore Missions
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* YOUR MISSIONS SECTION */}
          <div className="missions-section">
            <h2 className="section-title">Your Missions</h2>
            <div className="missions-filter">
              <button
                className={`filter-btn ${missionFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMissionFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${missionFilter === 'in-progress' ? 'active' : ''}`}
                onClick={() => setMissionFilter('in-progress')}
              >
                In Progress
              </button>
              <button
                className={`filter-btn ${missionFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setMissionFilter('completed')}
              >
                Completed
              </button>
            </div>

            <div className="missions-grid">
              {filteredMissions.length > 0 ? (
                filteredMissions.map((mission) => (
                  <div 
                    key={mission._id} 
                    className={`mission-card ${mission.userProgress?.status || 'not-started'}`}
                  >
                    <div className="mission-header">
                      <h3>{mission.title}</h3>
                      <span 
                        className="mission-difficulty"
                        style={{
                          color: getDifficultyColor(mission.difficulty),
                          borderColor: getDifficultyColor(mission.difficulty)
                        }}
                      >
                        {mission.difficulty}
                      </span>
                    </div>

                    <div className="mission-body">
                      <p className="mission-description">{mission.description}</p>
                      <div className="mission-meta">
                        <span className="mission-type">
                          <i className="fas fa-cube"></i> {mission.type}
                        </span>
                        <span className="mission-points">
                          <i className="fas fa-star"></i> {mission.points} XP
                        </span>
                      </div>
                    </div>

                    <div className="mission-progress">
                      {mission.userProgress?.status === "completed" && (
                        <div className="progress-completed">
                          <i className="fas fa-check-circle"></i> Completed
                        </div>
                      )}
                      {mission.userProgress?.status === "in-progress" && (
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: "50%" }}></div>
                        </div>
                      )}
                    </div>

                    <Link 
                      to={`/mission/${mission._id}`} 
                      className="mission-action"
                    >
                      {mission.userProgress?.status === "completed" 
                        ? "Review" 
                        : mission.userProgress?.status === "in-progress" 
                        ? "Continue" 
                        : "Start"}
                    </Link>
                  </div>
                ))
              ) : (
                <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                  <i className="fas fa-box-open"></i>
                  <p>
                    {missionFilter === 'completed' && 'No completed missions yet'}
                    {missionFilter === 'in-progress' && 'No missions in progress'}
                    {missionFilter === 'all' && 'No missions available yet'}
                  </p>
                </div>
              )}
            </div>
          </div>


        </div>
      </>
    );
  }