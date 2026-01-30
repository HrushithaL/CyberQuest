import React, { useContext, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { apiUpdateUserProfile } from "../utils/api";
import "./Profile.css";

export default function Profile() {
  const { user, login } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("details");
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: true,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || "", email: user?.email || "", skillLevel: user?.skillLevel || "" });

  useEffect(() => {
    setProfileForm({ name: user?.name || "", email: user?.email || "", skillLevel: user?.skillLevel || "" });
  }, [user]);

  useEffect(() => {
    // Matrix background animation
    const canvas = document.getElementById("profile-matrix");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01アイウエオカキクケコ";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function draw() {
      ctx.fillStyle = "rgba(5, 8, 22, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff88";
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 35);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleSettingChange = (setting) => {
    setSettings({ ...settings, [setting]: !settings[setting] });
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage("Password must be at least 6 characters!");
      return;
    }
    // API call would go here
    setMessage("Password changed successfully!");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const updateProfileField = (field, value) => setProfileForm(prev => ({ ...prev, [field]: value }));

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const updated = await apiUpdateUserProfile({ name: profileForm.name, email: profileForm.email, skillLevel: profileForm.skillLevel });
      // refresh auth context
      const token = localStorage.getItem("token");
      login(updated, token);
      setMessage("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setMessage("Failed to save profile");
    }
  };

  const topicStats = [
    { topic: "Phishing", accuracy: 85, completed: 8 },
    { topic: "Password Security", accuracy: 92, completed: 6 },
    { topic: "Malware", accuracy: 78, completed: 5 },
    { topic: "Social Engineering", accuracy: 88, completed: 7 },
    { topic: "Network Basics", accuracy: 81, completed: 4 },
  ];

  return (
    <>
      <Navbar />
      <canvas id="profile-matrix" className="matrix-bg"></canvas>

      <div className="profile-container">
        {/* User Header */}
        <div className="profile-header">
          <div className="user-avatar-large">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="user-info-header">
            {!editing && (
              <>
                <h1>{user?.name || "User"}</h1>
                <p className="user-email">{user?.email || "No email"}</p>
              </>
            )}
            {editing && (
              <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input className="form-control" value={profileForm.name} onChange={e => updateProfileField('name', e.target.value)} />
                <input className="form-control" value={profileForm.email} onChange={e => updateProfileField('email', e.target.value)} />
                <select className="form-control" value={profileForm.skillLevel || ''} onChange={e => updateProfileField('skillLevel', e.target.value)}>
                  <option value="">Select Skill Level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-primary-custom" type="submit">Save</button>
                  <button className="btn-primary-custom" type="button" onClick={() => { setEditing(false); setProfileForm({ name: user?.name || '', email: user?.email || '' }); }}>Cancel</button>
                </div>
              </form>
            )}
            <div className="user-rank">
              <span className="rank-badge">Level 12</span>
              <span className="xp-badge">2,450 XP</span>
            </div>
            {!editing && <button className="btn-primary-custom" style={{ marginLeft: '12px' }} onClick={() => setEditing(true)}>Edit Profile</button>}
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            👤 My Details
          </button>
          <button
            className={`tab-button ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            📊 Stats
          </button>
          <button
            className={`tab-button ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* My Details Tab */}
        {activeTab === "details" && (
          <div className="profile-content details-content">
            <section className="stats-section">
              <h2>👤 Account Information</h2>
              <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>

                {/* Personal Info Card */}
                <div className="stat-card" style={{ padding: '25px' }}>
                  <h3 style={{ color: '#00ff88', marginBottom: '20px', fontSize: '1.1rem' }}>📋 Personal Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '10px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Full Name</span>
                      <span style={{ fontWeight: 'bold', color: '#ffffff' }}>{user?.name || 'Not set'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '10px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Email</span>
                      <span style={{ fontWeight: 'bold', color: '#ffffff' }}>{user?.email || 'Not set'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '10px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Skill Level</span>
                      <span style={{
                        fontWeight: 'bold',
                        textTransform: 'capitalize',
                        color: user?.skillLevel === 'expert' ? '#ff0080' :
                          user?.skillLevel === 'advanced' ? '#00d4ff' :
                            user?.skillLevel === 'intermediate' ? '#00ff88' : '#ffa500'
                      }}>
                        {user?.skillLevel || 'Not set'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Account Type</span>
                      <span style={{ fontWeight: 'bold', color: user?.role === 'admin' ? '#ff0080' : '#00ff88' }}>
                        {user?.role === 'admin' ? '👑 Admin' : '🎮 Player'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Game Stats Card */}
                <div className="stat-card" style={{ padding: '25px' }}>
                  <h3 style={{ color: '#00ff88', marginBottom: '20px', fontSize: '1.1rem' }}>🎯 Game Statistics</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '10px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Total Score</span>
                      <span style={{ fontWeight: 'bold', color: '#ffd700', fontSize: '1.2rem' }}>
                        ⭐ {user?.score?.toLocaleString() || 0} XP
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '10px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Level</span>
                      <span style={{ fontWeight: 'bold', color: '#00ff88', fontSize: '1.2rem' }}>
                        🏆 Level {user?.level || 1}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '10px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Missions Completed</span>
                      <span style={{ fontWeight: 'bold', color: '#ffffff' }}>{user?.completedMissions || 0}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Accuracy Rate</span>
                      <span style={{ fontWeight: 'bold', color: '#00d4ff' }}>{user?.accuracy || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Account Info Card */}
                <div className="stat-card" style={{ padding: '25px' }}>
                  <h3 style={{ color: '#00ff88', marginBottom: '20px', fontSize: '1.1rem' }}>📅 Account Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '10px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Member Since</span>
                      <span style={{ fontWeight: 'bold', color: '#ffffff' }}>
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Unknown'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,255,136,0.1)', paddingBottom: '10px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>User ID</span>
                      <span style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '0.85rem', color: '#ffffff' }}>
                        {user?._id?.slice(-8) || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.7)' }}>Status</span>
                      <span style={{
                        fontWeight: 'bold',
                        color: '#00ff88',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88' }}></span>
                        Active
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Edit Profile Button */}
              <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button
                  className="btn-primary-custom"
                  onClick={() => setEditing(true)}
                  style={{ padding: '12px 30px' }}
                >
                  ✏️ Edit Profile
                </button>
                <button
                  className="btn-primary-custom"
                  onClick={() => setActiveTab("settings")}
                  style={{ padding: '12px 30px', background: 'rgba(0,212,255,0.2)', color: '#00d4ff' }}
                >
                  ⚙️ Account Settings
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="profile-content stats-content">
            {/* Quick Stats */}
            <section className="stats-section">
              <h2>📈 Quick Stats</h2>
              <div className="quick-stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">✓</div>
                  <div className="stat-details">
                    <p className="stat-label">Missions Completed</p>
                    <p className="stat-value">30</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-details">
                    <p className="stat-label">Total XP</p>
                    <p className="stat-value">2,450</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💯</div>
                  <div className="stat-details">
                    <p className="stat-label">Accuracy Rate</p>
                    <p className="stat-value">{user?.accuracy ?? 0}%</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-details">
                    <p className="stat-label">Rank</p>
                    <p className="stat-value">#47</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Topic-wise Performance */}
            <section className="stats-section">
              <h2>📚 Topic-wise Performance</h2>
              <div className="topic-stats">
                {topicStats.map((stat, idx) => (
                  <div key={idx} className="topic-stat-item">
                    <div className="topic-header">
                      <h3>{stat.topic}</h3>
                      <span className="accuracy-badge">{stat.accuracy}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${stat.accuracy}%` }}
                      ></div>
                    </div>
                    <p className="missions-text">{stat.completed} missions completed</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="profile-content settings-content">
            {/* Notification Settings */}
            <section className="settings-section">
              <h2>🔔 Notifications</h2>
              <div className="setting-item">
                <div className="setting-info">
                  <p>Push Notifications</p>
                  <span className="setting-desc">Receive mission alerts and achievements</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={() => handleSettingChange("notifications")}
                  />
                  <span className="slider"></span>
                </label>
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <p>Email Updates</p>
                  <span className="setting-desc">Weekly progress reports and news</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.emailUpdates}
                    onChange={() => handleSettingChange("emailUpdates")}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </section>

            {/* Password Change */}
            <section className="settings-section">
              <h2>🔐 Security</h2>
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                {message && <p className="form-message">{message}</p>}
                <button type="submit" className="submit-btn">
                  Update Password
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
