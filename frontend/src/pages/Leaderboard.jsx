import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiGetLeaderboard } from "../utils/api";
import { Trophy } from "lucide-react";

export default function Leaderboard() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("all-time");
  const [hoveredUser, setHoveredUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetLeaderboard();
      // Filter out super admin from leaderboard
      const filteredData = (data || []).filter(user => 
        user.email !== 'superadmin@cyberquest.com' && 
        user.name?.toLowerCase() !== 'super admin'
      );
      setList(filteredData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load leaderboard");
      console.error("Leaderboard error:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600";
    if (rank === 2) return "from-gray-300 to-gray-500";
    if (rank === 3) return "from-orange-400 to-orange-600";
    return "from-slate-500 to-slate-700";
  };

  return (
    <>
      <style>{`
        body { padding-top: 70px; }

        .leaderboard-container {
          min-height: 100vh;
          color: #fff;
        }

        .leaderboard-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .leaderboard-title {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 8px rgba(0, 255, 136, 0.25);
        }

        .leaderboard-subtitle {
          color: #94a3b8;
          font-size: 1.1rem;
        }

        .filter-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid transparent;
          background: rgba(30, 41, 59, 0.8);
          color: #cbd5e1;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .filter-btn:hover {
          background: rgba(51, 65, 85, 0.9);
          border-color: var(--accent);
        }

        .filter-btn.active {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #000;
          border-color: var(--primary);
        }

        .leaderboard-table-wrapper {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 255, 136, 0.1);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(0, 255, 136, 0.05);
        }

        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
        }

        .leaderboard-table thead tr {
          background: rgba(30, 41, 59, 0.9);
          border-bottom: 2px solid rgba(0, 255, 136, 0.2);
        }

        .leaderboard-table th {
          padding: 1.25rem 1.5rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.95rem;
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .leaderboard-table tbody tr {
          border-bottom: 1px solid rgba(0, 255, 136, 0.1);
          transition: 0.2s ease;
          position: relative;
        }

        .leaderboard-table tbody tr:hover {
          background: rgba(0, 255, 136, 0.05);
        }

        .leaderboard-table td {
          padding: 1.25rem 1.5rem;
          vertical-align: middle;
        }

        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          font-weight: bold;
          font-size: 1rem;
          color: #fff;
          margin-right: 0.5rem;
        }

        .rank-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .user-name {
          font-weight: 600;
          font-size: 1.05rem;
          color: #f1f5f9;
        }

        .xp-points {
          font-weight: 700;
          color: var(--primary);
          font-size: 1.1rem;
        }

        .xp-badges-wrapper {
          display: flex;
          align-items: center;
          gap: 3rem;
        }

        .xp-points {
          min-width: 120px;
        }

        .badges-container {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          background: rgba(168, 85, 247, 0.2);
          border: 1px solid rgba(168, 85, 247, 0.5);
          border-radius: 50%;
          color: #d8b4fe;
          font-size: 0.8rem;
        }

        .profile-preview {
          position: absolute;
          bottom: -180px;
          left: 1.5rem;
          z-index: 50;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 12px;
          padding: 1.25rem;
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          width: 250px;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .profile-item {
          margin-bottom: 1rem;
        }

        .profile-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .profile-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f1f5f9;
        }

        .profile-value.highlight {
          color: var(--primary);
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.5);
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
          color: #fca5a5;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .loading-message {
          text-align: center;
          padding: 2rem;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .empty-message {
          text-align: center;
          padding: 3rem 2rem;
          color: #94a3b8;
        }

        .empty-message svg {
          opacity: 0.5;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .leaderboard-title {
            font-size: 1.8rem;
          }

          .leaderboard-table th,
          .leaderboard-table td {
            padding: 0.75rem;
            font-size: 0.9rem;
          }

          .rank-badge {
            width: 2rem;
            height: 2rem;
            font-size: 0.9rem;
          }

          .filter-buttons {
            gap: 0.5rem;
          }

          .filter-btn {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>

      <Navbar />

      <div className="leaderboard-container">
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "3rem 40px" }}>
          {/* Header */}
          <div className="leaderboard-header">
            <div className="leaderboard-title">
              <span style={{ fontSize: "2.5rem" }}>🏆</span>
              Global Rankings
            </div>
            <p className="leaderboard-subtitle">Compete and climb the leaderboard</p>
          </div>

          {/* Filters */}
          <div className="filter-buttons">
            {[
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
              { label: "All-time", value: "all-time" }
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`filter-btn ${filter === f.value ? "active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span style={{ fontSize: "1.2rem" }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="leaderboard-table-wrapper">
              <div className="loading-message">
                <span style={{ fontSize: "1.2rem", animation: "spin 1s linear infinite" }}>⏳</span>
                <span>Loading leaderboard...</span>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          {!loading && (
            <div className="leaderboard-table-wrapper">
              {list.length > 0 ? (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>User</th>
                      <th>
                        <div style={{ display: "flex", alignItems: "center", gap: "3rem" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "120px" }}>
                            ⚡ XP/Points
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            🎖️ Badges
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((user, i) => {
                      const rank = i + 1;
                      const medal = getMedalEmoji(rank);
                      const rankGradient = getRankColor(rank);
                      const badgeCount = Math.min(5, Math.floor((user.score || 0) / 500));

                      return (
                        <tr
                          key={user._id || i}
                          onMouseEnter={() => setHoveredUser(i)}
                          onMouseLeave={() => setHoveredUser(null)}
                        >
                          <td>
                            <div className="rank-display">
                              <div className={`rank-badge bg-gradient-to-br ${rankGradient}`}>
                                {medal || rank}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="user-name">{user.name}</div>
                          </td>
                          <td>
                            <div className="xp-badges-wrapper">
                              <div className="xp-points">{user.score || 0} pts</div>
                              <div className="badges-container">
                                {badgeCount > 0 ? (
                                  [...Array(badgeCount)].map((_, j) => (
                                    <div key={j} className="badge">
                                      ⭐
                                    </div>
                                  ))
                                ) : (
                                  <span style={{ color: "#64748b" }}>—</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Profile Preview */}
                          {hoveredUser === i && (
                            <td
                              colSpan="3"
                              style={{
                                padding: 0,
                                position: "relative",
                                height: "200px"
                              }}
                            >
                              <div className="profile-preview">
                                <div className="profile-item">
                                  <div className="profile-label">Name</div>
                                  <div className="profile-value">{user.name}</div>
                                </div>
                                <div className="profile-item">
                                  <div className="profile-label">Total XP</div>
                                  <div className="profile-value highlight">{user.score || 0}</div>
                                </div>
                                <div className="profile-item">
                                  <div className="profile-label">Completed Missions</div>
                                  <div className="profile-value">{Math.floor((user.score || 0) / 100)}</div>
                                </div>
                                <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(0, 255, 136, 0.1)" }}>
                                  <div className="profile-label">Rank</div>
                                  <div className="profile-value">#{rank}</div>
                                </div>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-message">
                  <Trophy size={40} />
                  <div>
                    <p style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                      No leaderboard data available
                    </p>
                    <p style={{ fontSize: "0.95rem" }}>Complete missions to appear on the leaderboard</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}