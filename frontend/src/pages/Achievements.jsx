import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import "./Achievements.css";

export default function Achievements() {
  const { user } = useContext(AuthContext);
  const [achievements, setAchievements] = useState([]);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    // Matrix background animation
    const canvas = document.getElementById("matrix-bg");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01#@!$%^&*(){}[]<>+-*/=?~`|\\;:,'\"./HACK_CYBER_SECURITY_ATTACK_DEFENSE_EXPLOIT_PAYLOAD";
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

  useEffect(() => {
    // Mock data for achievements
    const earned = [
      {
        id: 1,
        name: "Beginner Defender",
        icon: "🛡️",
        description: "Complete your first mission",
        unlockedAt: "2024-01-15",
        color: "#00ff88",
      },
      {
        id: 2,
        name: "Phishing Hunter",
        icon: "🎣",
        description: "Complete 5 phishing missions",
        unlockedAt: "2024-02-10",
        color: "#00d4ff",
      },
      {
        id: 3,
        name: "Malware Buster",
        icon: "🦠",
        description: "Complete 5 malware missions",
        unlockedAt: "2024-02-20",
        color: "#ff0080",
      },
      {
        id: 4,
        name: "Streak Master",
        icon: "🔥",
        description: "Complete 10 missions in a row",
        unlockedAt: "2024-03-05",
        color: "#ffaa00",
      },
    ];

    const locked = [
      {
        id: 5,
        name: "Security Expert",
        icon: "🔐",
        description: "Complete 50 missions",
        progress: 28,
        total: 50,
        color: "#00ff88",
      },
      {
        id: 6,
        name: "Perfect Score",
        icon: "💯",
        description: "Get 100% accuracy on 5 missions",
        progress: 2,
        total: 5,
        color: "#00d4ff",
      },
      {
        id: 7,
        name: "Speed Runner",
        icon: "⚡",
        description: "Complete a mission in under 30 seconds",
        progress: 0,
        total: 1,
        color: "#ffaa00",
      },
    ];

    const milestoneDta = [
      {
        id: 1,
        title: "Missions Completed",
        icon: "✓",
        current: 28,
        target: 50,
        reward: 500,
        color: "#00ff88",
      },
      {
        id: 2,
        title: "XP Earned",
        icon: "⭐",
        current: 2450,
        target: 5000,
        reward: 1000,
        color: "#00d4ff",
      },
      {
        id: 3,
        title: "Perfect Scores",
        icon: "💯",
        current: 2,
        target: 10,
        reward: 750,
        color: "#ff0080",
      },
    ];

    setAchievements([...earned, ...locked]);
    setMilestones(milestoneDta);
  }, []);

  return (
    <>
      <Navbar />
      <canvas id="matrix-bg" className="matrix-bg"></canvas>

      <div className="achievements-container">
        <div className="achievements-header">
          <h1>🏆 Achievements</h1>
          <p>Unlock badges and track your progress towards mastery</p>
        </div>

        {/* Earned Achievements */}
        <section className="achievements-section">
          <h2 className="section-title">Earned Achievements</h2>
          <div className="achievements-grid">
            {achievements
              .filter((a) => a.unlockedAt)
              .map((achievement) => (
                <div
                  key={achievement.id}
                  className="achievement-card earned"
                  style={{ borderColor: achievement.color }}
                >
                  <div className="achievement-icon" style={{ color: achievement.color }}>
                    {achievement.icon}
                  </div>
                  <h3>{achievement.name}</h3>
                  <p>{achievement.description}</p>
                  <span className="unlock-date">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {/* Locked Achievements */}
        <section className="achievements-section">
          <h2 className="section-title">Locked Achievements</h2>
          <div className="achievements-grid">
            {achievements
              .filter((a) => !a.unlockedAt)
              .map((achievement) => (
                <div
                  key={achievement.id}
                  className="achievement-card locked"
                  style={{ borderColor: achievement.color }}
                >
                  <div className="achievement-icon locked-icon" style={{ color: achievement.color }}>
                    🔒 {achievement.icon}
                  </div>
                  <h3>{achievement.name}</h3>
                  <p>{achievement.description}</p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(achievement.progress / achievement.total) * 100}%`,
                        backgroundColor: achievement.color,
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {achievement.progress} / {achievement.total}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {/* Milestones */}
        <section className="achievements-section">
          <h2 className="section-title">🎯 Milestones</h2>
          <div className="milestones-grid">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="milestone-card"
                style={{ borderColor: milestone.color }}
              >
                <div className="milestone-header">
                  <h3>{milestone.title}</h3>
                  <span className="milestone-icon">{milestone.icon}</span>
                </div>
                <div className="milestone-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(milestone.current / milestone.target) * 100}%`,
                        backgroundColor: milestone.color,
                      }}
                    ></div>
                  </div>
                  <span className="milestone-text">
                    {milestone.current} / {milestone.target}
                  </span>
                </div>
                <div className="milestone-reward">
                  <span className="reward-icon">⭐</span>
                  <span className="reward-xp">{milestone.reward} XP</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
