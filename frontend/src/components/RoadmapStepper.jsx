import React from 'react';
import './RoadmapStepper.css';

export default function RoadmapStepper({ roadmap, progress = {}, onItemClick, onComplete, loading = false }) {
  if (!roadmap || !roadmap.levels) return null;

  const completedIds = new Set(
    (progress?.missions || []).filter(m => m.status === 'completed').map(m => String(m.missionId))
  );

  const levels = roadmap.levels;

  const isLevelUnlocked = (idx) => {
    if (idx === 0) return true;
    // previous level's every item should be completed
    const prev = levels[idx - 1];
    return prev.items.every(it => it.missionId && completedIds.has(String(it.missionId)));
  };

  return (
    <div className="roadmap-stepper">
      {levels.map((lvl, idx) => (
        <div key={lvl.level} className={`roadmap-level ${isLevelUnlocked(idx) ? 'unlocked' : 'locked'}`}>
          <div className="level-header">
            <div className="level-index">Level {lvl.level}</div>
            <div className="level-title">{lvl.title}</div>
          </div>
          <div className="level-items">
            {lvl.items.map((it, i) => {
              const completed = it.missionId && completedIds.has(String(it.missionId));
              const disabled = !isLevelUnlocked(idx) || loading;
              return (
                <div key={i} className={`roadmap-item ${completed ? 'completed' : ''} ${disabled ? 'disabled' : 'active'}`} onClick={() => !disabled && onItemClick && onItemClick(it)}>
                  <div className="item-name">{it.name}</div>
                  <div className="item-meta">
                    {completed ? <span className="badge done">Completed</span> : it.missionId ? <span className="badge play">Mission</span> : <span className="badge lesson">Lesson</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {loading && (
        <div style={{ padding: 8, color: 'var(--primary)', fontWeight: 'bold' }}>Loading mission…</div>
      )}

      <style>{` .roadmap-stepper { display:flex; flex-direction:column; gap:14px; } `}</style>
    </div>
  );
}
