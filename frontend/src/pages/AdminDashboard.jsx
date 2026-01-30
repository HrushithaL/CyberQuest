import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  apiGetAllUsers,
  apiGetSystemStats,
  apiGetUserGeneratedMissions,
  apiGetAllTopics,
  apiGetAllRoadmaps,
  apiAssignRoadmapToUser,
  apiCreateTopic,
  apiUpdateTopic,
  apiDeleteTopic,
  apiCreateRoadmap,
  apiUpdateRoadmap,
  apiDeleteRoadmap,
  apiReviewMission,
  apiDeleteMission,
  apiGetMissionProgress,
  apiGetUserProgressAdmin,
  apiRecommendForRole,
  apiUpdateUser,
  apiDeleteUser,
  apiGetAllContactMessages,
  apiUpdateMessageStatus,
  apiDeleteContactMessage,
  apiReplyToMessage,
} from "../utils/admin_api_utils";

// Admin navbar
import AdminNavbar from "../components/AdminNavbar";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");

  // show admin navbar
  // (imported component added at top of file)

  const [users, setUsers] = useState([]);
  const [missions, setMissions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [contactMessages, setContactMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMissions: 0,
    publishedMissions: 0,
    totalTopics: 0,
    totalRoadmaps: 0,
    avgUserScore: 0,
    topUsers: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [missionProgressModal, setMissionProgressModal] = useState(null);
  const [userProgressModal, setUserProgressModal] = useState(null);
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData, missionsData, topicsData, roadmapsData, messagesData] = await Promise.all([
        apiGetAllUsers(),
        apiGetSystemStats(),
        apiGetUserGeneratedMissions(),
        apiGetAllTopics(),
        apiGetAllRoadmaps(),
        apiGetAllContactMessages().catch(() => [])
      ]);

      setUsers(usersData);
      setStats(statsData);
      setMissions(missionsData);
      setTopics(topicsData);
      setRoadmaps(roadmapsData);
      setContactMessages(messagesData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Failed to load admin data");
    }
    setLoading(false);
  };

  // Topic handlers (quick prompts for MVP)
  const handleCreateTopic = async () => {
    const name = prompt('Topic name');
    if (!name) return;
    const icon = prompt('Icon (emoji or text)', '📘');
    try {
      await apiCreateTopic({ name, icon });
      await fetchAllData();
      alert('Topic created');
    } catch (err) {
      console.error(err);
      alert('Failed to create topic');
    }
  };

  const handleEditTopic = async (topic) => {
    const name = prompt('Topic name', topic.name);
    if (!name) return;
    const icon = prompt('Icon (emoji or text)', topic.icon);
    try {
      await apiUpdateTopic(topic._id, { name, icon });
      await fetchAllData();
      alert('Topic updated');
    } catch (err) {
      console.error(err);
      alert('Failed to update topic');
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm('Delete topic?')) return;
    try {
      await apiDeleteTopic(topicId);
      await fetchAllData();
      alert('Topic deleted');
    } catch (err) {
      console.error(err);
      alert('Failed to delete topic');
    }
  };

  // Roadmap handlers
  const handleCreateRoadmap = async () => {
    const name = prompt('Roadmap name');
    if (!name) return;
    const duration = prompt('Duration (e.g. 4 weeks)', '4 weeks');
    const difficulty = prompt('Difficulty (beginner|intermediate|advanced)', 'beginner');
    try {
      await apiCreateRoadmap({ name, duration, difficulty });
      await fetchAllData();
      alert('Roadmap created');
    } catch (err) {
      console.error(err);
      alert('Failed to create roadmap');
    }
  };

  const handleEditRoadmap = async (r) => {
    const name = prompt('Roadmap name', r.name);
    if (!name) return;
    const duration = prompt('Duration (e.g. 4 weeks)', r.duration || '');
    const difficulty = prompt('Difficulty (beginner|intermediate|advanced)', r.difficulty || 'beginner');
    try {
      await apiUpdateRoadmap(r._id, { name, duration, difficulty });
      await fetchAllData();
      alert('Roadmap updated');
    } catch (err) {
      console.error(err);
      alert('Failed to update roadmap');
    }
  };

  const handleDeleteRoadmap = async (id) => {
    if (!window.confirm('Delete roadmap?')) return;
    try {
      await apiDeleteRoadmap(id);
      await fetchAllData();
      alert('Roadmap deleted');
    } catch (err) {
      console.error(err);
      alert('Failed to delete roadmap');
    }
  };

  // Missions review/delete
  const handleReviewMission = async (missionId, approve) => {
    try {
      await apiReviewMission(missionId, approve);
      await fetchAllData();
      alert('Mission updated');
    } catch (err) {
      console.error(err);
      alert('Failed to update mission');
    }
  };

  const handleDeleteMission = async (missionId) => {
    if (!window.confirm('Delete mission?')) return;
    try {
      await apiDeleteMission(missionId);
      await fetchAllData();
      alert('Mission deleted');
    } catch (err) {
      console.error(err);
      alert('Failed to delete mission');
    }
  };

  const handleViewMissionProgress = async (mission) => {
    try {
      const data = await apiGetMissionProgress(mission._id);
      setMissionProgressModal({ mission, entries: data });
    } catch (err) {
      console.error(err);
      alert('Failed to load mission progress');
    }
  };

  const handleViewUserProgress = async (user) => {
    try {
      const data = await apiGetUserProgressAdmin(user._id);
      setUserProgressModal({ user, data });
    } catch (err) {
      console.error(err);
      alert('Failed to load user progress');
    }
  };

  const handleGenerateRoadmapForRole = async () => {
    const role = prompt('Role name (e.g. analyst, developer, pentester)');
    if (!role) return;
    const skillLevel = prompt('Skill level (beginner|intermediate|advanced)', 'beginner');
    try {
      const { roadmap } = await apiRecommendForRole(role, skillLevel);
      // Create roadmap on server (use topic ids if present)
      const topicIds = roadmap.topics.map(t => t.id).filter(Boolean);
      await apiCreateRoadmap({ name: roadmap.name, description: roadmap.description, duration: roadmap.duration, difficulty: roadmap.difficulty, topics: topicIds });
      await fetchAllData();
      alert('Roadmap generated and saved');
    } catch (err) {
      console.error(err);
      alert('Failed to generate roadmap');
    }
  };

  useEffect(() => {
    fetchAllData();

    const onRoadmapsRefresh = () => fetchAllData();

    // listen for external refresh events
    window.addEventListener('roadmapsRefresh', onRoadmapsRefresh);

    return () => {
      window.removeEventListener('roadmapsRefresh', onRoadmapsRefresh);
    };
  }, []);

  if (!user) return null;

  // Handle user update
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await apiUpdateUser(editingUser._id, editForm);
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, ...editForm } : u));
      setEditingUser(null);
      setEditForm({});
      alert("User updated successfully");
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user");
    }
  };

  // Handle user delete
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await apiDeleteUser(userId);
        setUsers(users.filter(u => u._id !== userId));
        alert("User deleted successfully");
      } catch (err) {
        console.error("Error deleting user:", err);
        alert("Failed to delete user");
      }
    }
  };

  const skillColors = {
    beginner: "#ffa500",
    intermediate: "#00ff88",
    advanced: "#00d4ff",
    expert: "#ff0080"
  };

  // Contact message handlers
  const handleMarkMessageRead = async (messageId) => {
    try {
      await apiUpdateMessageStatus(messageId, "read");
      setContactMessages(contactMessages.map(m =>
        m._id === messageId ? { ...m, status: "read" } : m
      ));
    } catch (err) {
      console.error("Error marking message as read:", err);
      alert("Failed to update message status");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await apiDeleteContactMessage(messageId);
      setContactMessages(contactMessages.filter(m => m._id !== messageId));
      if (selectedMessage?._id === messageId) setSelectedMessage(null);
      alert("Message deleted successfully");
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("Failed to delete message");
    }
  };

  const handleArchiveMessage = async (messageId) => {
    try {
      await apiUpdateMessageStatus(messageId, "archived");
      setContactMessages(contactMessages.map(m =>
        m._id === messageId ? { ...m, status: "archived" } : m
      ));
    } catch (err) {
      console.error("Error archiving message:", err);
      alert("Failed to archive message");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "unread": return "#ff0080";
      case "read": return "#ffa500";
      case "replied": return "#00ff88";
      case "archived": return "#666";
      default: return "#fff";
    }
  };

  const handleSendReply = async () => {
    if (!replyModal || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const result = await apiReplyToMessage(replyModal._id, replyText);
      setContactMessages(contactMessages.map(m =>
        m._id === replyModal._id ? { ...m, status: "replied", replyMessage: replyText } : m
      ));
      if (selectedMessage?._id === replyModal._id) {
        setSelectedMessage({ ...selectedMessage, status: "replied", replyMessage: replyText });
      }
      setReplyModal(null);
      setReplyText("");
      alert(result.emailSent ? "Reply sent successfully via email!" : "Reply saved (email not configured on server)");
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <>
      <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} />
      <div style={{ paddingTop: 40 }}>
        <div style={styles.container}>
          <style>{`
        /* Theme variables moved to src/styles/theme.css */
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Background and color are provided by src/styles/theme.css */

        /* Header card look matching mission header */
        .admin-header-card {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.06), rgba(0, 212, 255, 0.06));
          border: 2px solid rgba(0, 255, 136, 0.18);
          border-radius: 15px;
          padding: 16px;
        }

        /* General admin list/cards */
        .admin-card {
          background: rgba(10,14,39,0.9);
          border: 2px solid rgba(0,255,136,0.12);
          border-radius: 12px;
          padding: 12px;
        }

        .tabButtonActive {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: #000;
        }
      `}</style>

          {/* Header */}
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>⚙️ Admin Dashboard</h1>
              <p style={styles.subtitle}>Manage users, missions, and learning content</p>
            </div>
            <div style={styles.headerDate}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Content */}
          <div style={styles.content}>
            {loading ? (
              <div style={styles.loading}>
                <div style={styles.spinner}></div>
                <p>Loading...</p>
              </div>
            ) : (
              <>
                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div style={styles.section}>
                    <div style={styles.statsGrid}>
                      {[
                        { icon: '👥', label: 'Total Users', value: stats.totalUsers, color: '#00ff88' },
                        { icon: '🎯', label: 'Missions', value: stats.totalMissions, color: '#00d4ff' },
                        { icon: '✅', label: 'Published', value: stats.publishedMissions, color: '#ffd700' },
                        { icon: '🛣️', label: 'Roadmaps', value: stats.totalRoadmaps, color: '#ffa500' },
                        { icon: '⭐', label: 'Avg Score', value: stats.avgUserScore.toFixed(0), color: '#00ff88' }
                      ].map((stat, idx) => (
                        <div key={idx} style={styles.statCard}>
                          <div style={{ fontSize: '32px', marginBottom: '10px' }}>{stat.icon}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>{stat.label}</div>
                          <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Top Users */}
                    <div style={styles.card}>
                      <h3 style={styles.cardTitle}>🏆 Top Users</h3>
                      <div>
                        {stats.topUsers?.slice(0, 5).map((u, idx) => (
                          <div key={idx} style={styles.leaderboardItem}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{idx + 1}.</span>
                            <span style={{ flex: 1, marginLeft: '10px' }}>{u.name}</span>
                            <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{u.score} XP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                  <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>User Management</h2>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.tableHeader}>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Score</th>
                            <th style={styles.th}>Level</th>
                            <th style={styles.th}>Skill</th>
                            <th style={styles.th}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u, idx) => (
                            <tr key={u._id} style={{ ...styles.tableRow, animation: `slideIn 0.5s ease-out ${idx * 0.05}s both` }}>
                              <td style={styles.td}>{u.name}</td>
                              <td style={styles.td}>{u.email}</td>
                              <td style={styles.td}><span style={styles.badge}>{u.score}</span></td>
                              <td style={styles.td}>{u.level}</td>
                              <td style={styles.td}>
                                <span style={{ ...styles.skillBadge, color: skillColors[u.skillLevel] }}>
                                  {u.skillLevel}
                                </span>
                              </td>
                              <td style={styles.td}>
                                <button style={styles.btnSmall} onClick={() => { setSelectedUser(u); setEditingUser(u); setEditForm({ skillLevel: u.skillLevel }); }}>
                                  Edit
                                </button>
                                <button style={{ ...styles.btnSmall, background: 'rgba(0,0,0,0.12)', color: '#00d4ff' }} onClick={() => handleViewUserProgress(u)}>📊 Progress</button>
                                <button style={{ ...styles.btnSmall, background: 'rgba(255,0,128,0.2)', color: '#ff0080' }} onClick={() => handleDeleteUser(u._id)}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* MISSIONS TAB */}
                {activeTab === 'missions' && (
                  <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>User-Generated Missions</h2>
                    <div style={styles.grid}>
                      {missions.length > 0 ? (
                        missions.map((m, idx) => (
                          <div key={m._id} style={{ ...styles.missionCard, animation: `slideIn 0.5s ease-out ${idx * 0.05}s both` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                              <h4 style={{ margin: 0, fontSize: '14px' }}>{m.title}</h4>
                              <span style={{ ...styles.difficultyBadge, background: m.difficulty === 'hard' ? '#ff008030' : m.difficulty === 'medium' ? '#ffa50030' : '#00ff8830' }}>
                                {m.difficulty}
                              </span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '8px 0' }}>{m.description}</p>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
                              By: <strong>{m.createdBy?.name}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <span style={styles.tag}>{m.topic}</span>
                              <span style={styles.tag}>{m.type}</span>
                            </div>
                            <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                              <button style={{ ...styles.btnSmall, flex: 1, background: m.isPublished ? '#00ff8830' : 'rgba(0,0,0,0.3)', color: m.isPublished ? '#00ff88' : '#fff' }} onClick={() => handleReviewMission(m._id, !m.isPublished)}>
                                {m.isPublished ? '✓ Published' : '⋯ Review'}
                              </button>
                              <button style={{ ...styles.btnSmall, background: 'rgba(0,0,0,0.12)', color: '#00d4ff' }} onClick={() => handleViewMissionProgress(m)}>📊 View Progress</button>
                              <button style={{ ...styles.btnSmall, background: 'rgba(255,0,128,0.12)', color: '#ff0080' }} onClick={() => handleDeleteMission(m._id)}>🗑️</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No missions yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* LEARN TAB */}
                {activeTab === 'learn' && (
                  <div style={styles.section}>




                    <h3 style={styles.sectionTitle}>Roadmaps</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {roadmaps.length > 0 ? (
                        roadmaps.map((r, idx) => {
                          const createdAt = r.createdAt ? new Date(r.createdAt) : null;
                          const isRecent = createdAt ? (Date.now() - createdAt.getTime()) < (1000 * 60 * 60 * 24) : false;
                          const userGenerated = (r.source === 'user') || !!r.createdBy || isRecent;
                          return (
                            <div key={r._id} style={{ ...styles.roadmapItem, animation: `slideIn 0.5s ease-out ${idx * 0.05}s both` }}>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 5px 0' }}>
                                  {r.name} {userGenerated && <span style={{ fontSize: '0.8rem', marginLeft: 8, color: '#00ff88', fontWeight: 700 }}>User-generated</span>}
                                </h4>
                                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{r.duration}</p>
                                {r.description && <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{r.description}</p>}
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ ...styles.skillBadge, color: '#00d4ff' }}>{r.difficulty}</span>
                                <button style={styles.btnSmall} onClick={() => handleEditRoadmap(r)}>✏️ Edit</button>
                                <button style={{ ...styles.btnSmall, background: 'rgba(0,255,136,0.08)', color: '#00ff88' }} onClick={async () => {
                                  try {
                                    const confirmAssign = window.prompt('Assign to user by id or email (enter user id or email):');
                                    if (!confirmAssign) return;
                                    const u = users.find(usr => usr.email === confirmAssign || String(usr._id) === confirmAssign);
                                    if (!u) {
                                      alert('User not found in current list. Use exact user id or email present in Users list.');
                                      return;
                                    }
                                    await apiAssignRoadmapToUser(r._id);
                                    alert('Roadmap assigned to user');
                                    fetchAllData();
                                  } catch (err) {
                                    console.error('Assign failed', err);
                                    alert('Failed to assign roadmap');
                                  }
                                }}>📤 Assign</button>
                                <button style={{ ...styles.btnSmall, background: 'rgba(255,0,128,0.12)', color: '#ff0080' }} onClick={() => handleDeleteRoadmap(r._id)}>🗑️ Delete</button>
                                <button style={{ ...styles.btnSmall, background: 'rgba(255,255,255,0.04)' }} onClick={() => alert(JSON.stringify(r, null, 2))}>🔍 View JSON</button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>No roadmaps</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && (
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>📬 Contact Messages</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>
                  Messages from the contact form. Click on a message to view details.
                </p>

                {/* Message Stats */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
                  <div style={{ ...styles.statCard, minWidth: '120px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff0080' }}>
                      {contactMessages.filter(m => m.status === 'unread').length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Unread</div>
                  </div>
                  <div style={{ ...styles.statCard, minWidth: '120px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffa500' }}>
                      {contactMessages.filter(m => m.status === 'read').length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Read</div>
                  </div>
                  <div style={{ ...styles.statCard, minWidth: '120px', padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ff88' }}>
                      {contactMessages.length}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>Total</div>
                  </div>
                </div>

                {/* Messages List */}
                <div style={{ display: 'grid', gridTemplateColumns: selectedMessage ? '1fr 1fr' : '1fr', gap: '20px' }}>
                  {/* Message List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {contactMessages.length > 0 ? (
                      contactMessages.map((msg, idx) => (
                        <div
                          key={msg._id}
                          style={{
                            ...styles.card,
                            cursor: 'pointer',
                            borderColor: selectedMessage?._id === msg._id ? '#00ff88' : 'rgba(0,255,136,0.2)',
                            animation: `slideIn 0.5s ease-out ${idx * 0.05}s both`,
                            position: 'relative'
                          }}
                          onClick={() => {
                            setSelectedMessage(msg);
                            if (msg.status === 'unread') handleMarkMessageRead(msg._id);
                          }}
                        >
                          {/* Unread indicator */}
                          {msg.status === 'unread' && (
                            <div style={{
                              position: 'absolute',
                              top: '15px',
                              right: '15px',
                              width: '10px',
                              height: '10px',
                              background: '#ff0080',
                              borderRadius: '50%'
                            }} />
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: msg.status === 'unread' ? 'bold' : 'normal' }}>
                              {msg.name}
                            </h4>
                            <span style={{
                              fontSize: '10px',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              background: `${getStatusColor(msg.status)}20`,
                              color: getStatusColor(msg.status),
                              textTransform: 'uppercase',
                              fontWeight: 'bold'
                            }}>
                              {msg.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: '#00d4ff', marginBottom: '5px' }}>{msg.email}</div>
                          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>{msg.subject}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {msg.message.substring(0, 80)}...
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ ...styles.card, textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
                        <p style={{ color: 'rgba(255,255,255,0.6)' }}>No messages yet</p>
                      </div>
                    )}
                  </div>

                  {/* Message Detail View */}
                  {selectedMessage && (
                    <div style={{ ...styles.card, position: 'sticky', top: '100px', height: 'fit-content' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>Message Details</h3>
                        <button
                          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '20px' }}
                          onClick={() => setSelectedMessage(null)}
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px' }}>From</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedMessage.name}</div>
                        <div style={{ fontSize: '14px', color: '#00d4ff' }}>{selectedMessage.email}</div>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px' }}>Subject</div>
                        <div style={{ fontSize: '15px', fontWeight: '600' }}>{selectedMessage.subject}</div>
                      </div>

                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px' }}>Message</div>
                        <div style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '15px',
                          borderRadius: '8px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {selectedMessage.message}
                        </div>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '3px' }}>Received</div>
                        <div style={{ fontSize: '13px' }}>{new Date(selectedMessage.createdAt).toLocaleString()}</div>
                      </div>

                      {/* Show Admin Reply if exists */}
                      {selectedMessage.replyMessage && (
                        <div style={{
                          marginBottom: '20px',
                          background: 'rgba(0,255,136,0.1)',
                          borderRadius: '12px',
                          border: '1px solid rgba(0,255,136,0.3)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            background: 'rgba(0,255,136,0.15)',
                            padding: '12px 15px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '13px' }}>
                                ✓ Your Reply
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                              {selectedMessage.repliedAt && new Date(selectedMessage.repliedAt).toLocaleString()}
                            </span>
                          </div>
                          <div style={{
                            padding: '15px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                            color: 'rgba(255,255,255,0.9)'
                          }}>
                            {selectedMessage.replyMessage}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          style={{ ...styles.btnPrimary, flex: 1 }}
                          onClick={() => {
                            setReplyModal(selectedMessage);
                            setReplyText(selectedMessage.replyMessage || "");
                          }}
                        >
                          {selectedMessage.replyMessage ? '✏️ Edit Reply' : '✉️ Reply via Email'}
                        </button>
                        <button
                          style={{ ...styles.btnSmall, background: 'rgba(255,165,0,0.2)', color: '#ffa500' }}
                          onClick={() => handleArchiveMessage(selectedMessage._id)}
                        >
                          📁 Archive
                        </button>
                        <button
                          style={{ ...styles.btnSmall, background: 'rgba(255,0,128,0.2)', color: '#ff0080' }}
                          onClick={() => handleDeleteMessage(selectedMessage._id)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Edit User Modal */}
          {editingUser && (
            <div style={styles.modal} onClick={() => setEditingUser(null)}>
              <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: '20px' }}>Edit User</h2>
                <div style={{ marginBottom: '15px' }}>
                  <label style={styles.label}>Name</label>
                  <input
                    type="text"
                    style={styles.input}
                    value={editForm.name || editingUser.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={styles.label}>Skill Level</label>
                  <select
                    style={styles.input}
                    value={editForm.skillLevel || editingUser.skillLevel}
                    onChange={(e) => setEditForm({ ...editForm, skillLevel: e.target.value })}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={handleUpdateUser}>Save</button>
                  <button style={{ ...styles.btnPrimary, background: 'rgba(255,0,128,0.2)', color: '#ff0080', flex: 1 }} onClick={() => setEditingUser(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Mission Progress Modal */}
          {missionProgressModal && (
            <div style={styles.modal} onClick={() => setMissionProgressModal(null)}>
              <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: '10px' }}>Progress — {missionProgressModal.mission.title}</h2>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {missionProgressModal.entries.length > 0 ? (
                    missionProgressModal.entries.map((e, idx) => (
                      <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div><strong>{e.user?.name || 'Unknown'}</strong> <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{e.user?.email || ''}</span></div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold' }}>{e.status}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{e.score} pts</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No progress entries yet</p>
                  )}
                </div>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={() => setMissionProgressModal(null)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* User Progress Modal */}
          {userProgressModal && (
            <div style={styles.modal} onClick={() => setUserProgressModal(null)}>
              <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: '10px' }}>Progress — {userProgressModal.user.name}</h2>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {userProgressModal.data?.missions?.length > 0 ? (
                    userProgressModal.data.missions.map((m, idx) => (
                      <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div><strong>{m.missionId?.title || 'Mission'}</strong><div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{m.missionId?.difficulty}</div></div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold' }}>{m.status}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{m.score} pts</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No progress yet</p>
                  )}
                </div>
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button style={{ ...styles.btnPrimary, flex: 1 }} onClick={() => setUserProgressModal(null)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Reply Modal */}
          {replyModal && (
            <div style={styles.modal} onClick={() => { setReplyModal(null); setReplyText(""); }}>
              <div style={{ ...styles.modalContent, maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  ✉️ Reply to {replyModal.name}
                </h2>

                <div style={{ marginBottom: '15px', padding: '15px', background: 'rgba(0,255,136,0.05)', borderRadius: '8px', borderLeft: '4px solid #00ff88' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>Original Message:</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>{replyModal.subject}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxHeight: '80px', overflowY: 'auto' }}>
                    {replyModal.message}
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={styles.label}>To: {replyModal.email}</label>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={styles.label}>Your Reply</label>
                  <textarea
                    style={{ ...styles.input, minHeight: '150px', resize: 'vertical' }}
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={sendingReply}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    style={{ ...styles.btnPrimary, flex: 1, opacity: sendingReply ? 0.7 : 1 }}
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                  >
                    {sendingReply ? '📤 Sending...' : '📨 Send Reply'}
                  </button>
                  <button
                    style={{ ...styles.btnPrimary, background: 'rgba(255,0,128,0.2)', color: '#ff0080', flex: 1 }}
                    onClick={() => { setReplyModal(null); setReplyText(""); }}
                    disabled={sendingReply}
                  >
                    Cancel
                  </button>
                </div>

                <div style={{ marginTop: '15px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                  💡 The email will be sent to {replyModal.email} with a professional template
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  container: { background: '#0a0e27', minHeight: '100vh', color: '#fff', padding: '90px 20px 50px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid rgba(0,255,136,0.2)', flexWrap: 'wrap', gap: '20px' },
  title: { fontSize: '32px', fontWeight: 'bold', margin: 0, background: 'linear-gradient(135deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { color: 'rgba(255,255,255,0.6)', margin: '5px 0 0', fontSize: '14px' },
  headerDate: { padding: '10px 20px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '8px', fontSize: '12px', color: '#00ff88' },
  tabsContainer: { display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid rgba(0,255,136,0.2)', overflowX: 'auto' },
  tabButton: { padding: '12px 24px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '14px', fontWeight: '500', borderBottom: '3px solid transparent', whiteSpace: 'nowrap' },
  tabButtonActive: { color: '#00ff88', borderBottomColor: '#00ff88' },
  content: { maxWidth: '1400px', margin: '0 auto' },
  section: { animation: 'slideIn 0.5s ease-out' },
  sectionTitle: { fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', background: 'linear-gradient(135deg, #00ff88, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' },
  statCard: { background: 'rgba(10,14,39,0.8)', border: '2px solid rgba(0,255,136,0.2)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' },
  card: { background: 'rgba(10,14,39,0.8)', border: '2px solid rgba(0,255,136,0.2)', borderRadius: '12px', padding: '20px', backdropFilter: 'blur(10px)' },
  cardTitle: { fontSize: '16px', fontWeight: 'bold', marginBottom: '15px', margin: 0 },
  leaderboardItem: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,255,136,0.1)' },
  tableWrapper: { overflowX: 'auto', background: 'rgba(10,14,39,0.8)', border: '2px solid rgba(0,255,136,0.2)', borderRadius: '12px', backdropFilter: 'blur(10px)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: 'rgba(0,255,136,0.1)', borderBottom: '2px solid rgba(0,255,136,0.3)' },
  th: { padding: '15px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' },
  tableRow: { borderBottom: '1px solid rgba(0,255,136,0.1)', transition: 'all 0.3s ease' },
  td: { padding: '12px 15px', fontSize: '13px' },
  badge: { background: 'rgba(255,215,0,0.2)', color: '#ffd700', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  skillBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  btnSmall: { background: 'rgba(0,255,136,0.2)', border: '1px solid #00ff88', color: '#00ff88', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  btnPrimary: { background: 'linear-gradient(135deg, #00ff88, #00d4ff)', border: 'none', color: '#000', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' },
  missionCard: { background: 'rgba(10,14,39,0.8)', border: '2px solid rgba(0,255,136,0.2)', borderRadius: '12px', padding: '15px', backdropFilter: 'blur(10px)' },
  difficultyBadge: { padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' },
  tag: { background: 'rgba(0,212,255,0.1)', border: '1px solid #00d4ff', color: '#00d4ff', padding: '4px 8px', borderRadius: '4px', fontSize: '10px' },
  topicCard: { background: 'rgba(10,14,39,0.8)', border: '2px solid rgba(0,255,136,0.2)', borderRadius: '12px', padding: '15px', backdropFilter: 'blur(10px)' },
  roadmapItem: { background: 'rgba(10,14,39,0.8)', border: '2px solid rgba(0,255,136,0.2)', borderRadius: '12px', padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', backdropFilter: 'blur(10px)' },
  loading: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px' },
  spinner: { width: '50px', height: '50px', border: '4px solid rgba(0,255,136,0.1)', borderTop: '4px solid #00ff88', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'rgba(10,14,39,0.95)', border: '2px solid rgba(0,255,136,0.3)', borderRadius: '12px', padding: '30px', maxWidth: '400px', width: '90%', animation: 'slideIn 0.3s ease-out' },
  label: { fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '6px', color: '#fff', fontSize: '13px', boxSizing: 'border-box' }
};

export default AdminDashboard;