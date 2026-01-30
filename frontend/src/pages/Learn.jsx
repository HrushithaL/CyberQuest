import React, { useState, useEffect, useContext, useRef } from "react";
import { createPortal } from 'react-dom';
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import "./Learn.css";
import { AuthContext } from "../context/AuthContext";
import { apiGetTopicById, apiCreateTopic, apiGetAllRoadmaps } from "../utils/admin_api_utils";
import { apiGetTopics, apiGetMissions, apiGenerateTopicContent, apiGenerateRoadmap, apiSaveRoadmap, apiGetMyProgress, apiCompleteMission, apiGenerateMission, apiGenerateMissionForTopic, apiGetUserProfile } from "../utils/api";
import RoadmapStepper from "../components/RoadmapStepper";

export default function Learn() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [selectedRole, setSelectedRole] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [expandedLesson, setExpandedLesson] = useState(null);

  const [topics, setTopics] = useState([]);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  // NOTE: custom topic input removed per UX request
  // Multiple generated roadmaps support
  const [generatedRoadmaps, setGeneratedRoadmaps] = useState([]);
  const [currentRoadmapIndex, setCurrentRoadmapIndex] = useState(0);
  const [myProgress, setMyProgress] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // for item-generation actions

  // Roles list (for search & suggestions) with simple categories (Defensive / Offensive / Mixed / Other)
  const roles = [
    { value: 'analyst', label: 'Analyst', category: 'Defensive' },
    { value: 'developer', label: 'Developer', category: 'Other' },
    { value: 'pentester', label: 'Pentester', category: 'Offensive' },

    { value: 'white-hat-hacker', label: 'White Hat Hacker', category: 'Offensive' },
    { value: 'black-hat-hacker', label: 'Black Hat Hacker', category: 'Offensive' },
    { value: 'grey-hat-hacker', label: 'Grey Hat Hacker', category: 'Offensive' },
    { value: 'ethical-hacker', label: 'Ethical Hacker', category: 'Offensive' },
    { value: 'script-kiddie', label: 'Script Kiddie', category: 'Offensive' },
    { value: 'hacktivist', label: 'Hacktivist', category: 'Offensive' },
    { value: 'state-sponsored-hacker', label: 'State-Sponsored Hacker', category: 'Offensive' },
    { value: 'insider-threat', label: 'Insider Threat', category: 'Offensive' },
    { value: 'cyber-criminal', label: 'Cyber Criminal', category: 'Offensive' },
    { value: 'penetration-tester', label: 'Penetration Tester', category: 'Offensive' },
    { value: 'red-hat-hacker', label: 'Red Hat Hacker', category: 'Offensive' },

    { value: 'blue-team', label: 'Blue Team', category: 'Defensive' },
    { value: 'red-team', label: 'Red Team', category: 'Offensive' },
    { value: 'purple-team', label: 'Purple Team', category: 'Mixed' },

    { value: 'security-analyst', label: 'Security Analyst', category: 'Defensive' },
    { value: 'cybersecurity-analyst', label: 'Cybersecurity Analyst', category: 'Defensive' },
    { value: 'soc-analyst', label: 'SOC Analyst', category: 'Defensive' },
    { value: 'incident-responder', label: 'Incident Responder', category: 'Defensive' },
    { value: 'digital-forensics-analyst', label: 'Digital Forensics Analyst', category: 'Defensive' },
    { value: 'malware-analyst', label: 'Malware Analyst', category: 'Defensive' },
    { value: 'threat-hunter', label: 'Threat Hunter', category: 'Defensive' },

    { value: 'security-engineer', label: 'Security Engineer', category: 'Defensive' },
    { value: 'network-security-engineer', label: 'Network Security Engineer', category: 'Defensive' },
    { value: 'cloud-security-engineer', label: 'Cloud Security Engineer', category: 'Defensive' },
    { value: 'application-security-engineer', label: 'Application Security Engineer', category: 'Defensive' },
    { value: 'iam-specialist', label: 'IAM Specialist', category: 'Defensive' },

    { value: 'grc-analyst', label: 'GRC Analyst', category: 'Defensive' },
    { value: 'security-auditor', label: 'Security Auditor', category: 'Defensive' },
    { value: 'security-manager', label: 'Security Manager', category: 'Defensive' },
    { value: 'devops', label: 'DevOps', category: 'Other' },
    { value: 'beginner', label: 'Beginner', category: 'Other' }
  ];

  // Search + suggestion states for role picker
  const [roleSearch, setRoleSearch] = useState('');
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const roleInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const [suggestionRect, setSuggestionRect] = useState(null);

  // Persist generated roadmap so it does not vanish on navigation/refresh
  // Load and persist multiple generated roadmaps
  useEffect(() => {
    try {
      const savedMulti = localStorage.getItem('generatedRoadmaps');
      if (savedMulti) {
        const arr = JSON.parse(savedMulti) || [];
        if (Array.isArray(arr)) setGeneratedRoadmaps(arr);
      } else {
        // migrate from old single-key storage if present
        const legacy = localStorage.getItem('generatedRoadmap');
        if (legacy) {
          const one = JSON.parse(legacy);
          if (one) setGeneratedRoadmaps([one]);
          // keep legacy for safety; do not remove automatically
        }
      }
    } catch (e) {
      console.warn('Failed to load generatedRoadmaps from localStorage', e);
    }
  }, []);

  const persistGeneratedRoadmaps = (arr) => {
    try {
      localStorage.setItem('generatedRoadmaps', JSON.stringify(arr || []));
    } catch (e) {
      console.warn('Failed to persist generatedRoadmaps', e);
    }
  };

  const addGeneratedRoadmap = (roadmap) => {
    setGeneratedRoadmaps(prev => {
      const next = [...prev, roadmap];
      persistGeneratedRoadmaps(next);
      return next;
    });
    setCurrentRoadmapIndex((prevIdx) => Math.max(0, generatedRoadmaps.length));
  };

  const updateGeneratedRoadmapAt = (idx, patch) => {
    setGeneratedRoadmaps(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      persistGeneratedRoadmaps(next);
      return next;
    });
  };

  // --- Debug logs (temporary) ---
  useEffect(() => {
    // Learn mounted
  }, []);

  useEffect(() => {
    // Learn state updated
  }, [topics, missions, myProgress, generatedRoadmaps]);
  // Matrix background animation
  useEffect(() => {
    const canvas = document.getElementById("matrix");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "ｦｧｨｩｪｫｬｭｮｯ ｱｲｳｴｵｶｷｸｹｺﾀﾁﾂﾃﾄﾅﾆﾇﾈﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ01";
    const fontSize = 15;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(0);

    function draw() {
      ctx.fillStyle = "rgba(10, 14, 39, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 255, 136, 0.1)";
      ctx.font = `${fontSize}px 'Courier New'`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const interval = setInterval(draw, 50);

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

  const refreshTopics = async () => {
    setLoading(true);
    try {
      const t = await apiGetTopics();
      const m = await apiGetMissions();

      const topicsWithProgress = (t || []).map(topic => {
        const related = (m || []).filter(mm => (mm.topic || '').toLowerCase() === (topic.name || '').toLowerCase());
        const completed = related.filter(r => r.userProgress?.status === 'completed').length;
        const progress = related.length ? Math.round((completed / related.length) * 100) : 0;
        return { ...topic, progress, missions: related };
      });

      setTopics(topicsWithProgress);
      setMissions(m || []);
    } catch (err) {
      console.error('Failed to load topics or missions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTopics();

    // Load user's saved/generated roadmap if available (server-side activeRoadmap or localStorage)
    (async () => {
      try {
        // server-side assigned roadmap
        if (user && user._id) {
          try {
            const profile = await apiGetUserProfile();
            const activeRoadmapId = profile?.user?.activeRoadmap;
            if (activeRoadmapId) {
              try {
                const roadmaps = await apiGetAllRoadmaps();
                const found = (roadmaps || []).find(r => String(r._id) === String(activeRoadmapId));
                if (found) {
                  // Add to local list if not already present, then focus it
                  setGeneratedRoadmaps(prev => {
                    const existingIdx = prev.findIndex(x => x?._id && String(x._id) === String(found._id));
                    if (existingIdx >= 0) {
                      setCurrentRoadmapIndex(existingIdx);
                      return prev;
                    }
                    const next = [...prev, found];
                    persistGeneratedRoadmaps(next);
                    setCurrentRoadmapIndex(next.length - 1);
                    return next;
                  });
                }
              } catch (err) {
                console.warn('Failed to load roadmaps for activeRoadmap check', err);
              }
            }
          } catch (err) {
            console.warn('Failed to fetch user profile for activeRoadmap check', err);
          }
        }

        // local fallback (already handled by separate effect but keep progress load here)
        const p = await apiGetMyProgress();
        setMyProgress(p?.progress || null);
      } catch (err) {
        console.error('Failed to load progress', err);
      }
    })();
  }, [user]);

  // Manage showing/hiding suggestions based on clicks outside the input/suggestions.
  useEffect(() => {
    const onPointerDown = (e) => {
      const target = e.target;
      if (suggestionsRef.current && suggestionsRef.current.contains(target)) {
        // click is inside suggestions - keep it open
        setShowRoleSuggestions(true);
        return;
      }
      if (roleInputRef.current && roleInputRef.current.contains(target)) {
        setShowRoleSuggestions(true);
        return;
      }
      setShowRoleSuggestions(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // Compute and update suggestion box position so it is rendered fixed and escapes stacking contexts
  useEffect(() => {
    const updatePosition = () => {
      const el = roleInputRef.current;
      if (!el) return setSuggestionRect(null);
      const r = el.getBoundingClientRect();
      setSuggestionRect({ top: r.bottom + 8, left: r.left, width: r.width });
    };

    if (showRoleSuggestions) updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showRoleSuggestions, roleSearch]);

  const generateContentForTopic = async (topicId) => {
    try {
      const res = await apiGenerateTopicContent(topicId);
      alert('Content generated for topic: ' + (res.topic?.name || '')); // basic feedback
      await refreshTopics();
    } catch (err) {
      console.error('Failed to generate content', err);
      alert('Failed to generate content');
    }
  };

  const handleAddTopic = async () => {
    if (!user || user.role !== 'admin') return alert('Only admins can add topics');
    const name = prompt('Topic name');
    if (!name) return;
    const icon = prompt('Icon (emoji or text)', '🧩');
    try {
      await apiCreateTopic({ name, icon });
      alert('Topic created');
      await refreshTopics();
    } catch (err) {
      console.error('Failed to create topic', err);
      alert('Failed to create topic');
    }
  };

  const handleTopicSelect = (topicId) => {
    setSelectedTopic(selectedTopic === topicId ? null : topicId);
    setExpandedLesson(null);
  };

  const handleLessonExpand = (lessonId) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
  };

  const selectedTopicData = topics.find(t => String(t._id) === String(selectedTopic));

  return (
    <>
      <style>{`
        /* Page-specific learn styles (theme variables are provided by src/styles/theme.css) */

        .learn-container {
          position: relative;
          z-index: 2;
          padding: 120px 2rem 50px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .learn-header h1 {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.75rem;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Make topic cards match mission cards */
        .topic-card {
          /* reuse shared card-like styles from theme.css */
        }

      `}</style>

      <Navbar />
      <div style={{ maxWidth: 1200, margin: '20px auto 0', padding: '0 20px' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: 8, borderRadius: 8, marginBottom: 12, color: '#fff' }}>
          <small>Debug: topics={topics.length} • missions={missions.length} • progressLoaded={!!myProgress}</small>
        </div>
      </div>
      {/* Role-based recommendations */}
      <div style={{ maxWidth: 1200, margin: '20px auto 0', padding: '0 20px', display: 'flex', gap: '12px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'center', width: 520 }}>
          <input
            id="role-search"
            ref={roleInputRef}
            placeholder="Type role to recommend (min 4 chars)"
            style={{ padding: '10px', borderRadius: 8, background: 'rgba(10,14,39,0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.04)', width: '100%' }}
            value={roleSearch}
            onChange={(e) => { setRoleSearch(e.target.value); setShowRoleSuggestions(true); setSelectedRole(null); }}
            onFocus={() => { setShowRoleSuggestions(true); }}
          />

          {/* Tooltip */}
          <div title={"Defensive roles focus on detection, protection and remediation. Offensive roles focus on attack and adversary simulation."} style={{ color: '#00d4ff', cursor: 'help', fontWeight: 700, padding: '6px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.12)' }}>i</div>

          {/* Suggestions dropdown */}
          {showRoleSuggestions && roleSearch && roleSearch.length >= 4 && (() => {
            const matches = roles.filter(r => (r.label || r.value).toLowerCase().includes(roleSearch.toLowerCase())).slice(0, 8);
            const suggestionsEl = (
              <div
                ref={suggestionsRef}
                onWheel={(e) => { e.stopPropagation(); }}
                style={{
                  position: suggestionRect ? 'fixed' : 'absolute',
                  top: suggestionRect ? suggestionRect.top : 'calc(100% + 8px)',
                  left: suggestionRect ? suggestionRect.left : 0,
                  width: suggestionRect ? suggestionRect.width : '100%',
                  background: 'rgba(10,14,39,0.98)',
                  border: '1px solid rgba(0,255,136,0.08)',
                  borderRadius: 8,
                  maxHeight: 240,
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  zIndex: 99999,
                  overscrollBehavior: 'contain',
                  pointerEvents: 'auto'
                }}
                tabIndex={-1}
              >
                {matches.length > 0 ? matches.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => {
                      try {
                        setSelectedRole(r.value);
                        setRoleSearch(r.label);
                        setShowRoleSuggestions(false);
                        if (roleInputRef.current) roleInputRef.current.focus();
                      } catch (err) { console.warn('suggestion click error', err); }
                    }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: 10, border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
                  >
                    <div style={{ fontWeight: 700 }}>{r.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{r.category}</div>
                  </button>
                )) : (
                  <div style={{ padding: 10, color: 'rgba(255,255,255,0.6)' }}>No matches</div>
                )}
              </div>
            );

            return (typeof document !== 'undefined' ? createPortal(suggestionsEl, document.body) : suggestionsEl);
          })()}
        </div>

        {user?.role === 'admin' && (
          <button className="btn btn-login" style={{ width: 'auto', minWidth: 140 }} onClick={handleAddTopic}>➕ Add Topic</button>
        )}

        <button className="btn btn-login" style={{ width: 'auto', minWidth: 180 }} onClick={async () => {
          // Resolve role from typed input if user didn't explicitly choose suggestion
          let roleToUse = selectedRole;
          if (!roleToUse && roleSearch && roleSearch.length >= 4) {
            const found = roles.find(r => r.label.toLowerCase().includes(roleSearch.toLowerCase()) || r.value.toLowerCase().includes(roleSearch.toLowerCase()));
            if (found) roleToUse = found.value;
          }
          if (!roleToUse) return alert('Select a role or type at least 4 characters and pick a suggestion');

          // Map extended roles to backend-supported base roles
          const roleAlias = {
            'security-engineer': 'analyst',
            'cloud-engineer': 'developer',
            'devops': 'developer',
            'incident-responder': 'analyst',
            'forensics': 'pentester',
            'manager': 'analyst',

            'white-hat-hacker': 'pentester',
            'black-hat-hacker': 'pentester',
            'grey-hat-hacker': 'pentester',
            'ethical-hacker': 'pentester',
            'script-kiddie': 'beginner',
            'hacktivist': 'pentester',
            'state-sponsored-hacker': 'pentester',
            'insider-threat': 'analyst',
            'cyber-criminal': 'pentester',
            'penetration-tester': 'pentester',
            'red-hat-hacker': 'pentester',

            'blue-team': 'analyst',
            'red-team': 'pentester',
            'purple-team': 'analyst',

            'security-analyst': 'analyst',
            'cybersecurity-analyst': 'analyst',
            'soc-analyst': 'analyst',
            'digital-forensics-analyst': 'analyst',
            'malware-analyst': 'analyst',
            'threat-hunter': 'analyst',

            'network-security-engineer': 'analyst',
            'cloud-security-engineer': 'developer',
            'application-security-engineer': 'developer',
            'iam-specialist': 'analyst',
            'grc-analyst': 'analyst',
            'security-auditor': 'analyst',
            'security-manager': 'analyst'
          };
          const mappedRole = roleAlias[roleToUse] || roleToUse;

          // Prevent duplicate generation for the same role if already present locally
          const dupIdx = generatedRoadmaps.findIndex(r => r?.name && r.name.toLowerCase().includes(String(mappedRole).toLowerCase()));
          if (dupIdx >= 0) {
            setCurrentRoadmapIndex(dupIdx);
            alert(`Roadmap for "${selectedRole}" is already present`);
            return;
          }

          // If user is logged in, check their server-assigned activeRoadmap for duplicates
          if (user && user._id) {
            try {
              const profile = await apiGetUserProfile();
              const activeRoadmapId = profile?.user?.activeRoadmap;
              if (activeRoadmapId) {
                try {
                  const roadmaps = await apiGetAllRoadmaps();
                  const found = (roadmaps || []).find(r => String(r._id) === String(activeRoadmapId));
                  if (found && found.name && String(found.name).toLowerCase().includes(String(mappedRole).toLowerCase())) {
                    // show the saved roadmap and inform the user
                    setGeneratedRoadmaps(prev => {
                      const existingIdx = prev.findIndex(x => x?._id && String(x._id) === String(found._id));
                      if (existingIdx >= 0) {
                        setCurrentRoadmapIndex(existingIdx);
                        return prev;
                      }
                      const next = [...prev, found];
                      persistGeneratedRoadmaps(next);
                      setCurrentRoadmapIndex(next.length - 1);
                      return next;
                    });
                    alert(`You already have a saved "${selectedRole}" roadmap`);
                    return;
                  }
                } catch (err) {
                  console.warn('Failed to fetch roadmaps for duplicate check', err);
                }
              }
            } catch (err) {
              console.warn('Failed to fetch user profile for duplicate check', err);
            }
          }

          setGenerating(true);
          try {
            const payload = { role: mappedRole, skillLevel: user?.skillLevel || 'beginner' };
            const res = await apiGenerateRoadmap(payload);
            const roadmap = res?.roadmap || null;
            if (!roadmap) throw new Error('No roadmap returned');

            // Add to local list and focus it
            addGeneratedRoadmap(roadmap);
            const newIndex = generatedRoadmaps.length; // appended to end

            // Auto-save and assign if user is authenticated
            if (user && user._id) {
              try {
                setActionLoading(true);
                const saveRes = await apiSaveRoadmap({ name: roadmap.name, description: roadmap.description, levels: roadmap.levels });
                const saved = saveRes?.roadmap || saveRes?.roadmap || saveRes || null;
                // If backend returns roadmap in different shape, merge as available
                if (saved && saved._id) {
                  updateGeneratedRoadmapAt(newIndex, { _id: saved._id, ...(saved || {}) });
                  alert('Roadmap saved and assigned to your profile');
                  const p = await apiGetMyProgress();
                  setMyProgress(p?.progress || null);

                  // Notify admin dashboard and other listeners to refresh roadmaps list immediately
                  try { window.dispatchEvent(new Event('roadmapsRefresh')); } catch (e) {}
                } else {
                  // Fallback: still update progress
                  const p = await apiGetMyProgress();
                  setMyProgress(p?.progress || null);
                  alert('Roadmap generated but saving returned unexpected response. It is visible locally.');
                }
              } catch (err) {
                console.error('Auto-save of roadmap failed:', err);
                // don't fail generation if save fails; show save button instead
                alert('Roadmap generated but failed to save automatically. You can save it manually using "Save to my Roadmap".');
              } finally {
                setActionLoading(false);
              }
            } else {
              // Not authenticated: prompt user to login if they want to save
              // Keep roadmap available for preview; show Save button that will prompt login
            }
          } catch (err) {
            console.error(err);
            alert('Failed to generate roadmap');
          } finally {
            setGenerating(false);
          }
        }}>{generating ? 'Generating...' : 'Generate Roadmap'}</button>
        {generatedRoadmaps.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Selector to switch between generated roadmaps */}
            {generatedRoadmaps.length > 1 && (
              <select
                value={currentRoadmapIndex}
                onChange={(e) => setCurrentRoadmapIndex(parseInt(e.target.value, 10) || 0)}
                style={{ background: 'rgba(10,14,39,0.9)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px' }}
              >
                {generatedRoadmaps.map((r, idx) => (
                  <option key={(r._id || idx) + '-opt'} value={idx}>
                    {(r?.name || 'Untitled Roadmap')}
                  </option>
                ))}
              </select>
            )}

            {/* If the selected roadmap is already saved (has an _id), show a saved note; otherwise show Save button */}
            {generatedRoadmaps[currentRoadmapIndex]?._id ? (
              <div style={{ color: 'rgba(0,255,136,0.9)', fontWeight: '700' }}>Saved & assigned to your profile</div>
            ) : (
              <button className="btn btn-login" style={{ width: 'auto', minWidth: 160 }} onClick={async () => {
                const current = generatedRoadmaps[currentRoadmapIndex];
                if (!current) return;
                if (!user || !user._id) {
                  alert('Please log in to save the roadmap to your profile.');
                  return;
                }
                try {
                  setActionLoading(true);
                  const saveRes = await apiSaveRoadmap({ name: current.name, description: current.description, levels: current.levels });
                  const saved = saveRes?.roadmap || saveRes || null;
                  if (saved && saved._id) {
                    updateGeneratedRoadmapAt(currentRoadmapIndex, { _id: saved._id, ...(saved || {}) });
                    alert('Roadmap saved & assigned to your profile');
                    const p = await apiGetMyProgress();
                    setMyProgress(p?.progress || null);
                  } else {
                    alert('Roadmap saved but unexpected response from server');
                  }
                } catch (err) {
                  console.error(err);
                  alert('Failed to save roadmap');
                } finally {
                  setActionLoading(false);
                }
              }}>Save to my Roadmap</button>
            )}
          </div>
        )}
      </div>
      <canvas id="matrix" style={{ position: "fixed", top: 0, left: 0, zIndex: 1 }}></canvas>
      
      <div className="learn-container">
        <div className="learn-header">
          <h1>Cyber Security Learning Hub</h1>
          <p>Master essential security concepts through interactive lessons</p>
        </div>

        {/* TOPICS GRID */}
        <div className="topics-grid">
          {/* My Generated Roadmaps overview (show when multiple are present) */}
          {generatedRoadmaps.length > 1 && (
            <div style={{ gridColumn: '1/-1', marginBottom: 12 }}>
              <h3 style={{ margin: 0, marginBottom: 8, color: '#fff' }}>My Generated Roadmaps</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {generatedRoadmaps.map((r, idx) => (
                  <div key={(r._id || idx) + '-card'} style={{
                    flex: '0 1 300px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(0,255,136,0.08)',
                    borderRadius: 10,
                    padding: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ color: '#fff' }}>{r?.name || 'Untitled Roadmap'}</strong>
                      {r?._id ? (
                        <span style={{ color: 'rgba(0,255,136,0.9)', fontSize: 12, fontWeight: 700 }}>Saved</span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Unsaved</span>
                      )}
                    </div>
                    {r?.description && (
                      <p style={{ marginTop: 0, marginBottom: 10, color: 'rgba(255,255,255,0.85)' }}>
                        {String(r.description).length > 120 ? `${String(r.description).slice(0, 120)}…` : r.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-login"
                        onClick={() => setCurrentRoadmapIndex(idx)}
                        style={{ minWidth: 90 }}
                      >
                        {currentRoadmapIndex === idx ? 'Viewing' : 'View'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Show recommendation summary (if present) */}
          {recommendation && (
            <div style={{ gridColumn: '1/-1', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 8, marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Recommended Roadmap: {recommendation.roadmap.name}</h3>
              <p style={{ margin: '6px 0' }}>{recommendation.roadmap.description} • {recommendation.roadmap.duration} • {recommendation.roadmap.difficulty}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {recommendation.topics.map((t) => (
                  <div key={t._id} style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>{t.name}</div>
                ))}
              </div>
            </div>
          )}

          {/* Generated roadmap (user-facing) */}
          {generatedRoadmaps[currentRoadmapIndex] && (
            <div style={{ gridColumn: '1/-1', marginBottom: 12 }}>
              <h3 style={{ margin: 0, marginBottom: 8, color: '#fff' }}>{generatedRoadmaps[currentRoadmapIndex].name}</h3>
              <p style={{ marginTop: 0, marginBottom: 8, color: '#fff' }}>{generatedRoadmaps[currentRoadmapIndex].description}</p>
              <RoadmapStepper roadmap={generatedRoadmaps[currentRoadmapIndex]} progress={myProgress} onItemClick={async (item) => {
                // If a mission exists, go straight to it
                if (item.missionId) {
                  navigate(`/mission/${item.missionId}`);
                  return;
                }

                // If the item maps to a saved topic (or at least has a name), attempt to auto-generate a starter mission via AI
                if (item.topicId || item.name) {
                  try {
                    setActionLoading(true);

                    // Determine topic name: prefer fetching DB topic for a nicer canonical name
                    let topicName = item.name || '';
                    if (item.topicId) {
                      try {
                        const t = await apiGetTopicById(item.topicId);
                        topicName = t?.topic?.name || t?.name || topicName;
                      } catch (err) {
                        // fallback to item.name if topic fetch fails
                        console.warn('Failed to fetch topic by id; using item name as topic:', err.message || err);
                      }
                    }

                    // Ensure we have a topic name
                    if (!topicName || topicName.trim() === '') {
                      throw new Error('No topic name available to generate a mission');
                    }

                    // Use the mission generation endpoint (OpenAI-backed) -- request a comprehensive mission (MCQs + scenarios + challenges)
                    const mission = await apiGenerateMission({ topic: topicName, difficulty: 'easy', type: 'comprehensive' });

                    // refresh topics/missions/progress
                    await refreshTopics();
                    const p = await apiGetMyProgress();
                    setMyProgress(p?.progress || null);

                    if (mission?._id) {
                      if (mission.aiFallback) alert('Notice: AI generation hit a limit or error; using fallback mission.');
                      // Notify user if mission includes scenarios/challenges
                      if ((mission.content?.scenarios?.length || 0) > 0 || (mission.content?.challenges?.length || 0) > 0) {
                        alert('Generated mission includes scenarios and challenges in addition to MCQs.');
                      }
                      navigate(`/mission/${mission._id}`);
                    } else if (mission?.mission?._id) {
                      // some endpoints wrap the mission under { mission }
                      if (mission?.mission?.aiFallback) alert('Notice: AI generation hit a limit or error; using fallback mission.');
                      if ((mission.mission.content?.scenarios?.length || 0) > 0 || (mission.mission.content?.challenges?.length || 0) > 0) {
                        alert('Generated mission includes scenarios and challenges in addition to MCQs.');
                      }
                      navigate(`/mission/${mission.mission._id}`);
                    } else {
                      // Fallback: if no mission returned, open topic details
                      if (item.topicId) setSelectedTopic(item.topicId);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }
                  } catch (err) {
                    console.error('Auto-generation (AI) failed', err);
                    const msg = err?.response?.data?.message || err?.message || 'Unknown error';

                    // Fallback: try topic-based simple generator (learnController) if topicId exists
                    if (item.topicId) {
                      try {
                        const fallbackRes = await apiGenerateMissionForTopic(item.topicId);
                        if (fallbackRes?.mission?._id) {
                          await refreshTopics();
                          const p = await apiGetMyProgress();
                          setMyProgress(p?.progress || null);
                          navigate(`/mission/${fallbackRes.mission._id}`);
                          return;
                        }
                      } catch (err2) {
                        console.error('Fallback topic-generation failed', err2);
                      }
                    }

                    alert('Failed to generate a mission for this topic: ' + msg);
                  } finally {
                    setActionLoading(false);
                  }

                  return;
                }

                // Otherwise instruct the user
                alert('No saved mission for this item yet. Try saving the roadmap first or contact admin to add content.');
              }} loading={actionLoading} />
            </div>
          )}
          {topics.map((topic) => (
            <div
              key={topic._id}
              className={`topic-card ${selectedTopic === topic._id ? 'active' : ''}`}
              onClick={() => handleTopicSelect(topic._id)}
              style={{ borderColor: topic.color || '#00ff88' }}
            >
              <div className="topic-icon" style={{ color: topic.color }}>
                <i className={`fas ${topic.icon}`}></i>
              </div>
              <h3>{topic.name}</h3>
              <p className="topic-description">{topic.description}</p>
              <div className="progress-info">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${topic.progress}%`, background: topic.color }}
                  ></div>
                </div>
                <span className="progress-text">{topic.progress}% Complete</span>
              </div>
              <div className="topic-lessons">
                {topic.lessons.length} lessons
              </div>
            </div>
          ))}
        </div>

        {/* LESSONS SECTION */}
        {selectedTopicData && (
          <div className="lessons-section">
            <div className="lessons-header">
              <h2>{selectedTopicData.name} - Lessons</h2>

              {selectedTopicData.lessons && selectedTopicData.lessons.length === 0 && user?.role === 'admin' && (
                <button className="btn btn-login" style={{ marginRight: 10 }} onClick={() => generateContentForTopic(selectedTopicData._id)}>
                  Generate Content
                </button>
              )}

              <button 
                className="close-btn"
                onClick={() => setSelectedTopic(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="lessons-list">
              {selectedTopicData.lessons && selectedTopicData.lessons.length > 0 ? (
                selectedTopicData.lessons.map((lesson, idx) => {
                  const lid = lesson._id || lesson.id || lesson.order || idx;
                  const keyPrefix = lesson._id || `lesson-${idx}`;
                  const kp = lesson.key_points || lesson.keyPoints || [];
                  const examples = lesson.examples || [];
                  const prevention = lesson.prevention || [];
                  const quiz = lesson.quiz || [];

                  return (
                    <div key={keyPrefix} className="lesson-item">
                      <div
                        className="lesson-header"
                        onClick={() => handleLessonExpand(lid)}
                      >
                        <div className="lesson-title-section">
                          <i className={`fas fa-chevron-right ${expandedLesson === lid ? 'expanded' : ''}`}></i>
                          <h4>{lesson.title}</h4>
                        </div>
                        <span className="lesson-number">Lesson {lesson.order || (idx + 1)}</span>
                      </div>

                      {expandedLesson === lid && (
                        <div className="lesson-content">
                          <div className="content-section">
                            <h5>Overview</h5>
                            <p>{lesson.content}</p>
                          </div>

                          {kp.length > 0 && (
                            <div className="content-section">
                              <h5>Key Points</h5>
                              <ul>
                                {kp.map((point, idx2) => (
                                  <li key={idx2}>
                                    <i className="fas fa-check-circle"></i>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {examples.length > 0 && (
                            <div className="content-section">
                              <h5>Real-World Examples</h5>
                              <div className="examples-grid">
                                {examples.map((example, idx2) => (
                                  <div key={idx2} className="example-card">
                                    <i className="fas fa-lightbulb"></i>
                                    <p>{example}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {prevention.length > 0 && (
                            <div className="content-section prevention">
                              <h5>Prevention Checklist</h5>
                              <div className="checklist">
                                {prevention.map((item, idx2) => (
                                  <div key={idx2} className="checklist-item">
                                    <input type="checkbox" id={`check-${lid}-${idx2}`} />
                                    <label htmlFor={`check-${lid}-${idx2}`}>
                                      {item}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {quiz.length > 0 && (
                            <div className="content-section">
                              <h5>Quick Quiz</h5>
                              <div className="quiz">
                                {quiz.map((q, qidx) => (
                                  <div key={qidx} className="quiz-question">
                                    <p className="question-text">{q?.question || '[Question missing]'}</p>
                                    <div className="quiz-options">
                                      {(q?.options || []).map((option, optIdx) => (
                                        <button
                                          key={optIdx}
                                          className="quiz-option"
                                          onClick={() => {
                                            if (optIdx === q?.answer) {
                                              alert("✅ Correct!");
                                            } else {
                                              alert("❌ Try again!");
                                            }
                                          }}
                                        >
                                          {option}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="lesson-footer">
                            <button 
                              className="btn-primary"
                              onClick={() => navigate('/missions')}
                            >
                              <i className="fas fa-play"></i> Test Your Knowledge with Missions
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-lessons">
                  <p>No lessons yet for this topic.</p>
                  {user?.role === 'admin' && (
                    <button className="btn btn-login" onClick={() => generateContentForTopic(selectedTopicData._id)}>Generate lessons & mission</button>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <h3>Related Missions</h3>
              {(selectedTopicData.missions || []).length === 0 && <p style={{ opacity: 0.8 }}>No missions yet for this topic.</p>}
              {(selectedTopicData.missions || []).map(m => (
                <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: 'rgba(0,0,0,0.25)', borderRadius: 8, marginBottom: 8 }}>
                  <div>
                    <b>{m.title}</b>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>{m.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-login" onClick={() => navigate(`/mission/${m._id}`)}>Start</button>
                    <button className="btn btn-login" onClick={async () => {
                      try {
                        await apiCompleteMission({ missionId: m._id, score: m.points || 100 });
                        const p = await apiGetMyProgress();
                        setMyProgress(p?.progress || null);
                        alert('Marked as complete');
                      } catch (err) {
                        console.error(err);
                        alert('Failed to mark complete');
                      }
                    }}>Mark complete</button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {!selectedTopic && (
          <div className="no-selection">
            <i className="fas fa-book"></i>
            <p>Select a topic above to start learning</p>
          </div>
        )}
      </div>
    </>
  );
}