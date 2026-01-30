import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function MissionCard({ m }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);

  // Check mission status on mount and when mission data changes
  useEffect(() => {
    const status = m.userProgress?.status || 'not-started';
    setIsCompleted(status === 'completed');
    setIsInProgress(status === 'in-progress');
  }, [m]);

  const getDifficultyColor = (difficulty) => {
    const d = difficulty?.toLowerCase();
    if (d === "easy") return "#00ff88";
    if (d === "medium") return "#00d4ff";
    if (d === "hard") return "#ffa500";
    if (d === "expert") return "#ff0080";
    return "#ffffff";
  };

  // Determine what content types this mission has
  const hasQuestions = m.content?.questions?.length > 0;
  const hasScenarios = m.content?.scenarios?.length > 0;
  const hasChallenges = m.content?.challenges?.length > 0;

  // Get content type badge
  const getContentTypeLabel = () => {
    const types = [];
    if (hasQuestions) types.push("MCQ");
    if (hasScenarios) types.push("Scenarios");
    if (hasChallenges) types.push("Challenges");

    // If the only type is MCQ, hide the 'MCQ' label to avoid duplication with difficulty
    if (types.length === 1 && types[0] === 'MCQ') return '';

    return types.join(" + ") || (m.type && m.type.toString().toLowerCase() !== 'mcq' ? m.type : '') || "";
  };

  // Get actual points from mission
  const points = m.points || 20;

  const handleStartMission = () => {
    try {
      localStorage.setItem(`mission_started_${m._id}`, new Date().toISOString());
    } catch (err) {
      // ignore localStorage errors
    }
  };

  return (
    <div className="mission-card-custom">
      <style>{`
        .mission-card-custom {
          background: rgba(10, 14, 39, 0.9);
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: 0.3s ease;
          box-shadow: 0 0 15px rgba(0, 255, 136, 0.05);
        }

        .mission-card-custom:hover {
          transform: translateX(10px);
          border-color: var(--primary);
          box-shadow: 0 0 25px rgba(0, 255, 136, 0.35);
        }

        .mission-card-custom.completed {
          border-color: rgba(0, 255, 136, 0.5);
          background: rgba(10, 14, 39, 0.95);
          opacity: 0.85;
        }

        .mission-title {
          font-size: 1.3rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mission-desc {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.7);
        }

        .mission-meta {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
          margin: 0.75rem 0;
        }

        .mission-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .badge-primary {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.5);
        }

        .badge-secondary {
          background: rgba(255, 0, 128, 0.2);
          color: #ff0080;
          border: 1px solid rgba(255, 0, 128, 0.5);
        }

        .badge-accent {
          background: rgba(0, 212, 255, 0.2);
          color: #00d4ff;
          border: 1px solid rgba(0, 212, 255, 0.5);
        }

        .badge-completed {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.5);
        }

        .mission-btn {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border: none;
          padding: 8px 18px;
          border-radius: 12px;
          font-weight: bold;
          color: #000000ff;
          transition: 0.3s ease;
          box-shadow: 0 0 15px rgba(0,255,136,0.3);
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mission-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 25px rgba(0,255,136,0.6);
          color: #000;
          text-decoration: none;
        }

        .mission-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .mission-btn-completed {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.3), rgba(0, 212, 255, 0.3));
          border: 1px solid rgba(0, 255, 136, 0.5);
          color: #00ff88;
          box-shadow: none;
          cursor: default;
          padding: 8px 16px;
        }

        .mission-btn-completed:hover {
          transform: none;
          box-shadow: none;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.85rem;
        }

        .status-completed {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
          border: 1px solid rgba(0, 255, 136, 0.5);
        }

        .status-in-progress {
          background: rgba(0, 212, 255, 0.2);
          color: #00d4ff;
          border: 1px solid rgba(0, 212, 255, 0.5);
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(0, 255, 136, 0.15);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 0.75rem;
        }

        .progress-fill {
          height: 100%;
          width: 45%;
          background: linear-gradient(90deg, var(--primary), var(--accent));
          border-radius: 3px;
        }
      `}</style>

      <div className={`mission-card-custom ${isCompleted ? 'completed' : ''}`}>
        <div className="d-flex justify-content-between align-items-start" style={{ marginBottom: '0.5rem' }}>
          <h5 className="mission-title">
            {isCompleted && <i className="fas fa-check-circle"></i>}
            {m.title}
          </h5>

          <span
            className="badge"
            style={{
              background: getDifficultyColor(m.difficulty),
              color: "#000",
              padding: "6px 12px",
              borderRadius: "20px",
              fontWeight: "bold",
              textTransform: "capitalize",
            }}
          >
            {m.difficulty}
          </span>
        </div>

        <p className="mission-desc">{m.description}</p>

        <div className="mission-meta">
          {getContentTypeLabel() && (
            <span className="mission-badge badge-primary">
              <i className="fas fa-list-check"></i> {getContentTypeLabel()}
            </span>
          )}

          <span className="mission-badge badge-accent">
            <i className="fas fa-star"></i> {points} XP
          </span>

          {m.topic && m.topic.toString().toLowerCase() !== 'mcq' && m.topic.toString().toLowerCase() !== 'multiple choice' && (
            <span className="mission-badge badge-secondary">
              <i className="fas fa-tag"></i> {m.topic}
            </span>
          )}
          {isCompleted && (
            <span className="mission-badge badge-completed">
              <i className="fas fa-trophy"></i> Completed
            </span>
          )}
        </div>

        {/* Show progress bar for in-progress missions */}
        {isInProgress && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
              In Progress
            </div>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        )}

        <div className="mt-3" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isCompleted ? (
            <span className="status-badge status-completed">
              <i className="fas fa-check-circle"></i> Completed
            </span>
          ) : (
            <>
              <Link 
                to={`/mission/${m._id}`} 
                className="mission-btn"
                onClick={handleStartMission}
              >
                <i className="fas fa-play"></i> {isInProgress ? 'Continue' : 'Start'} Mission
              </Link>
              {isInProgress && (
                <span className="status-badge status-in-progress">
                  <i className="fas fa-hourglass-half"></i> In Progress
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}