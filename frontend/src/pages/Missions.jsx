import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetMissions, apiGenerateMission } from "../utils/api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Missions() {
  const [missions, setMissions] = useState([]);
  const [difficulty, setDifficulty] = useState("easy");
  const [missionType, setMissionType] = useState("mcq");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateFallbacks, setGenerateFallbacks] = useState(0);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  /* ===========================
     INITIAL LOAD (ONCE)
     =========================== */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiGetMissions();
        setMissions(data);
      } catch (err) {
        console.error("Error loading missions:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ===========================
     EVENT-BASED REFRESH (on missions refresh event)
     =========================== */
  useEffect(() => {
    const handler = async () => {
      console.log("missionsRefresh event triggered");
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = await apiGetMissions();
        console.log("Updated missions:", data);
        setMissions(data);
      } catch (err) {
        console.error("Error refreshing missions:", err);
      } finally {
        setLoading(false);
      }
    };
    window.addEventListener("missionsRefresh", handler);
    return () => window.removeEventListener("missionsRefresh", handler);
  }, []);

  /* ===========================
     FOCUS/VISIBILITY REFRESH (when page regains focus)
     =========================== */
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible, refreshing missions");
        setLoading(true);
        try {
          const data = await apiGetMissions();
          setMissions(data);
        } catch (err) {
          console.error("Error refreshing missions on visibility:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    
    const handleFocus = async () => {
      console.log("Window focus event, refreshing missions");
      setLoading(true);
      try {
        const data = await apiGetMissions();
        setMissions(data);
      } catch (err) {
        console.error("Error refreshing missions on focus:", err);
      } finally {
        setLoading(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  /* ===========================
     MULTI-TAB SYNC (listen for storage events)
     =========================== */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user' || (e.key && e.key.startsWith('mission_completed_'))) {
        console.log("Storage event detected:", e.key);
        (async () => {
          setLoading(true);
          try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const data = await apiGetMissions();
            setMissions(data);
          } catch (err) {
            console.error("Error loading missions (storage):", err);
          } finally {
            setLoading(false);
          }
        })();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const difficultyPoints = {
    easy: 20,
    medium: 40,
    hard: 70,
    expert: 100,
  };

  const missionFormats = ['mcq', 'scenario', 'challenge', 'puzzle'];

  const handleGenerate = async () => {
    // Check if user is logged in before generating missions
    if (!user) {
      alert("Please log in to generate missions.");
      navigate("/login");
      return;
    }

    setGenerating(true);
    try {
      let newMissions = [];

      for (let i = 0; i < 3; i++) {
        const format = missionFormats[i % missionFormats.length];
        
        const mission = await apiGenerateMission({
          topic: missionType,
          type: format,
          difficulty: difficulty,
          format: format
        });

        mission.points = difficultyPoints[difficulty];
        mission.format = format;
        mission.difficulty = difficulty;
        
        newMissions.push(mission);
      }

      setMissions((prev) => [...newMissions, ...prev]);
      if (newMissions.some(m => m.aiFallback)) {
        const count = newMissions.filter(m => m.aiFallback).length;
        setGenerateFallbacks((prev) => prev + count);
      }
    } catch (err) {
      console.error("Error generating mission:", err);
      alert("Failed to generate missions. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleStartMission = (missionId) => {
    try {
      localStorage.setItem(`mission_started_${missionId}`, new Date().toISOString());
    } catch (err) {
      // ignore localStorage errors
    }
    navigate(`/mission/${missionId}`);
  };

  const getDifficultyColor = (diff) => {
    const d = diff?.toLowerCase();
    if (d === "easy") return "#00ff88";
    if (d === "medium") return "#00d4ff";
    if (d === "hard") return "#ffa500";
    if (d === "expert") return "#ff0080";
    return "#fff";
  };

  const getMissionTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "mcq": return "fa-question-circle";
      case "phishing": return "fa-fish";
      case "code-injection": return "fa-code";
      case "network-defense": return "fa-network-wired";
      case "password-crack": return "fa-lock";
      case "malware-analysis": return "fa-bug";
      case "cryptography": return "fa-key";
      case "sql-injection": return "fa-database";
      default: return "fa-crosshairs";
    }
  };

  const getFormatIcon = (format) => {
    switch (format?.toLowerCase()) {
      case "mcq": return "fa-list-check";
      case "scenario": return "fa-book-open";
      case "challenge": return "fa-flag-checkered";
      case "puzzle": return "fa-puzzle-piece";
      default: return "fa-circle";
    }
  };

  const getFormatLabel = (format) => {
    switch (format?.toLowerCase()) {
      case "mcq": return "Multiple Choice";
      case "scenario": return "Scenario-Based";
      case "challenge": return "Practical Challenge";
      case "puzzle": return "Logic Puzzle";
      default: return "Mission";
    }
  };

  const missionTypes = [
    { value: "mcq", label: "Social Engineering", icon: "fa-question-circle" },
    { value: "phishing", label: "Phishing Detection", icon: "fa-fish" },
    { value: "code-injection", label: "Code Injection", icon: "fa-code" },
    { value: "network-defense", label: "Network Defense", icon: "fa-network-wired" },
    { value: "password-crack", label: "Password Cracking", icon: "fa-lock" },
    { value: "malware-analysis", label: "Malware Analysis", icon: "fa-bug" },
    { value: "cryptography", label: "Cryptography", icon: "fa-key" },
    { value: "sql-injection", label: "SQL Injection", icon: "fa-database" },
    { value: "ransomware", label: "Ransomware Attack", icon: "fa-shield-virus" },
    { value: "web-exploit", label: "Web Exploitation", icon: "fa-globe" },
    { value: "forensics", label: "Forensics", icon: "fa-search" },
    { value: "physical-security", label: "Physical Security", icon: "fa-door-open" },
    { value: "insider-threat", label: "Insider Threats", icon: "fa-user-secret" },
    { value: "ddos", label: "DDoS Attacks", icon: "fa-server" },
    { value: "cloud-security", label: "Cloud Security", icon: "fa-cloud" },
    { value: "iot", label: "IoT Vulnerabilities", icon: "fa-microchip" },
  ];

  return (
    <>
      <Navbar />
      <style>{`
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          overflow-x: hidden;
        }

        .matrix-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          opacity: 0.1;
          pointer-events: none;
        }

        .missions-container {
          position: relative;
          z-index: 2;
          padding: 100px 0 50px;
          min-height: 100vh;
        }

        .page-header {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1));
          border: 2px solid rgba(0, 255, 136, 0.3);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
          text-align: center;
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }

        .generator-card {
          background: rgba(10, 14, 39, 0.9);
          border: 2px solid rgba(0, 255, 136, 0.3);
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(10px);
        }

        .form-label-custom {
          color: var(--primary);
          font-weight: 600;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .form-select-custom {
          background: rgba(0, 0, 0, 0.04);
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 15px;
          padding: 12px 20px;
          color: #fff;
          font-size: 1rem;
          transition: all 0.3s;
          width: 100%;
        }

        .form-select-custom:focus {
          background: rgba(0, 0, 0, 0.5);
          border-color: var(--primary);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
          color: #fff;
          outline: none;
        }

        .form-select-custom option {
          background: var(--dark);
          color: #fff;
        }

        .mission-type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .mission-type-card {
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 15px;
          padding: 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          color: #fff;
        }

        .mission-type-card:hover {
          border-color: var(--primary);
          transform: translateY(-5px);
          box-shadow: 0 5px 20px rgba(0, 255, 136, 0.3);
        }

        .mission-type-card.active {
          border-color: var(--primary);
          background: rgba(0, 255, 136, 0.1);
          box-shadow: 0 5px 20px rgba(0, 255, 136, 0.4);
          color: #fff;
        }

        .mission-type-icon {
          font-size: 2rem;
          color: var(--primary);
          margin-bottom: 0.5rem;
        }

        .mission-card {
          background: rgba(10, 14, 39, 0.9);
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 15px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: all 0.3s;
          cursor: pointer;
        }

        .mission-card:hover {
          border-color: var(--primary);
          transform: translateX(10px);
          box-shadow: 0 5px 20px rgba(0, 255, 136, 0.3);
        }

        .difficulty-badge {
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: bold;
          color: #000;
          display: inline-block;
        }

        .type-badge {
          background: rgba(0, 212, 255, 0.2);
          border: 1px solid var(--accent);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          color: var(--accent);
          display: inline-block;
        }

        .format-badge {
          background: rgba(255, 0, 128, 0.2);
          border: 1px solid var(--secondary);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          color: var(--secondary);
          display: inline-block;
        }

        .btn-primary-custom {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border: none;
          padding: 12px 30px;
          border-radius: 25px;
          font-weight: bold;
          color: #000;
          transition: all 0.3s;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(0, 255, 136, 0.5);
          color: #000;
        }

        .btn-primary-custom:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-spinner {
          display: inline-block;
          border: 3px solid rgba(0, 255, 136, 0.3);
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .generating-indicator {
          background: rgba(0, 255, 136, 0.1);
          border: 2px solid var(--primary);
          border-radius: 15px;
          padding: 1rem;
          text-align: center;
          margin-bottom: 1rem;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .rewards-info {
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid var(--accent);
          border-radius: 10px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .rewards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .reward-item {
          text-align: center;
          padding: 0.5rem;
        }

        .reward-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary);
        }

        .d-flex {
          display: flex;
        }

        .justify-content-between {
          justify-content: space-between;
        }

        .align-items-start {
          align-items: flex-start;
        }

        .align-items-center {
          align-items: center;
        }

        .gap-2 {
          gap: 0.5rem;
        }

        .mb-2 {
          margin-bottom: 0.5rem;
        }

        .mb-4 {
          margin-bottom: 1.5rem;
        }

        .mt-3 {
          margin-top: 1rem;
        }
      `}</style>

      <canvas className="matrix-bg" id="matrix"></canvas>

      <div className="missions-container">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

          <div className="page-header">
            <h1 className="page-title">
              <i className="fas fa-crosshairs"></i> Mission Control
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.1rem" }}>
              Generate scenario-based cybersecurity challenges and earn XP
            </p>
          </div>

          <div className="generator-card">
            <h3 style={{ color: "var(--primary)", marginBottom: "1.5rem" }}>
              <i className="fas fa-magic"></i> Generate New Missions
            </h3>

            <div className="mb-4">
              <label className="form-label-custom">
                <i className="fas fa-gamepad"></i> Select Mission Type
              </label>

              <div className="mission-type-grid">
                {missionTypes.map((type, index) => (
                  <div
                    key={index}
                    className={`mission-type-card ${missionType === type.value ? "active" : ""}`}
                    onClick={() => setMissionType(type.value)}
                  >
                    <div className="mission-type-icon">
                      <i className={`fas ${type.icon}`}></i>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>{type.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label-custom">
                <i className="fas fa-chart-line"></i> Difficulty Level
              </label>

              <select
                className="form-select-custom"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy - Perfect for beginners</option>
                <option value="medium">Medium - Moderate challenge</option>
                <option value="hard">Hard - Advanced skills required</option>
                <option value="expert">Expert - Master level</option>
              </select>

              <div className="rewards-info">
                <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  <i className="fas fa-trophy"></i> Rewards for {difficulty.toUpperCase()} missions
                </div>
                <div className="rewards-grid">
                  <div className="reward-item">
                    <div className="reward-value">{difficultyPoints[difficulty]}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>XP Points</div>
                  </div>
                  <div className="reward-item">
                    <div className="reward-value">3</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Missions</div>
                  </div>
                  <div className="reward-item">
                    <div className="reward-value" style={{ fontSize: '1.2rem' }}>
                      MCQ + Scenario + Challenge
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Variety</div>
                  </div>
                </div>
              </div>
            </div>

            {generating && (
              <div className="generating-indicator">
                <div className="loading-spinner"></div>
                <p style={{ color: "var(--primary)", margin: 0 }}>
                  <i className="fas fa-robot"></i> AI is creating 3 diverse missions for you...
                </p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                  This may take a few seconds
                </p>
              </div>
            )}

            <button
              className="btn-primary-custom"
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <span className="loading-spinner"></span> Generating...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i> Get Missions
                </>
              )}
            </button>
            {generateFallbacks > 0 && (
              <div style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.7)' }}>
                Note: {generateFallbacks} generated mission(s) used AI fallback (mock content) due to rate limits or errors.
              </div>
            )}
          </div>

          <h3 style={{ color: "var(--primary)", marginBottom: '1rem' }}>
            <i className="fas fa-list"></i> Available Missions ({missions.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="loading-spinner" style={{ width: '40px', height: '40px' }}></div>
              <p style={{ color: 'var(--primary)', marginTop: '1rem' }}>Loading missions...</p>
            </div>
          ) : missions.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '15px',
              border: '2px dashed rgba(0,255,136,0.3)'
              
            }}>
              <i className="fas fa-inbox" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
                No missions available yet. Generate some missions to get started!
              </p>
            </div>
          ) : (
            missions.map((mission) => (
              <div key={mission._id} className="mission-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div style={{ flex: 1 }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <i
                        className={`fas ${getMissionTypeIcon(mission.type)}`}
                        style={{ color: "var(--primary)", fontSize: "1.5rem" }}
                      ></i>
                      <h4 style={{ margin: 0 }}>{mission.title}</h4>
                    </div>

                    <div className="d-flex gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
                      <span
                        className="difficulty-badge"
                        style={{ background: getDifficultyColor(mission.difficulty) }}
                      >
                        {mission.difficulty?.toUpperCase() || 'EASY'}
                      </span>

                      <span className="type-badge">
                        <i className={`fas ${getMissionTypeIcon(mission.type)}`}></i> {mission.type}
                      </span>

                      {mission.format && (
                        <span className="format-badge">
                          <i className={`fas ${getFormatIcon(mission.format)}`}></i> {getFormatLabel(mission.format)}
                        </span>
                      )}

                      <span style={{ color: "var(--accent)", fontWeight: 'bold' }}>
                        <i className="fas fa-star"></i> {mission.points} XP
                      </span>
                    </div>

                    <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 0 }}>
                      {mission.description}
                    </p>
                  </div>

                  {(() => {
                    const status = mission.userProgress?.status || 'not-started';
                    const started = status === 'in-progress' || localStorage.getItem(`mission_started_${mission._id}`);
                    const completed = status === 'completed';
                    if (completed) return null;
                    return (
                      <button 
                        onClick={() => handleStartMission(mission._id)} 
                        className="btn-primary-custom"
                        style={{ marginLeft: '1rem', flexShrink: 0 }}
                      >
                        <i className="fas fa-play"></i> {started ? 'Continue' : 'Start'} Mission
                      </button>
                    );
                  })()}
                  
                  {mission.userProgress?.status === "completed" && (
                    <span style={{ marginLeft: '1rem', color: '#00ff88', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      <i className="fas fa-check-circle"></i> Completed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}