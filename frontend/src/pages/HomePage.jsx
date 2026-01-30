import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function HomePage() {
  const [heroProgress, setHeroProgress] = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [flipped, setFlipped] = useState(null);

  const challengeRoadmaps = {
    'bugbounty': [
      'Intro to Web Attacks',
      'SQL Injection Mission',
      'XSS Mission',
      'CSRF Attacks',
      'Final Quiz'
    ],
    'network': [
      'Networking Fundamentals',
      'Firewall Configuration',
      'IDS/IPS Setup',
      'Network Segmentation',
      'Capstone Challenge'
    ],
    'crypto': [
      'Cryptography Basics',
      'Encryption Algorithms',
      'Hash Functions',
      'Digital Signatures',
      'Security Audit'
    ]
  };

  useEffect(() => {
    // Matrix animation
    const canvas = document.getElementById("matrix");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01#@!$%^&*(){}[]<>+-*/=?~`|\\;:,'\"./HACK_CYBER_SECURITY_ATTACK_DEFENSE_EXPLOIT_PAYLOAD";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function drawMatrix() {
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

    const interval = setInterval(drawMatrix, 35);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Animate hero progress bar
    setTimeout(() => {
      setHeroProgress(45);
    }, 500);

    // Animated counter for stats
    const animateValue = (element, start, end, duration) => {
      if (!element) return;
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value.toLocaleString();
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    // Intersection Observer for stats animation
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.getAttribute("data-target"));
          animateValue(entry.target, 0, target, 2000);
          statsObserver.unobserve(entry.target);
        }
      });
    });

    document.querySelectorAll(".stats-number[data-target]").forEach((el) => {
      statsObserver.observe(el);
    });

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
      statsObserver.disconnect();
    };
  }, []);

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

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

        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 100px 0;
          margin-top: 80px;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(0, 255, 136, 0.1), transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(255, 0, 128, 0.1), transparent 50%);
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 2;
        }

        .glitch {
          font-size: 4rem;
          font-weight: bold;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          animation: glitch 3s infinite;
        }

        @keyframes glitch {
          0%, 100% { 
            text-shadow: 0 0 20px var(--primary); 
          }
          25% { 
            text-shadow: -2px 0 var(--secondary), 2px 0 var(--accent); 
          }
          50% { 
            text-shadow: 2px 0 var(--secondary), -2px 0 var(--accent); 
          }
          75% { 
            text-shadow: 0 0 30px var(--primary); 
          }
        }

        .btn-glow {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border: none;
          padding: 15px 40px;
          font-size: 1.1rem;
          font-weight: bold;
          border-radius: 50px;
          transition: all 0.3s;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
          position: relative;
          overflow: hidden;
          color: #000;
        }

        .btn-glow::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transform: rotate(45deg);
          transition: all 0.5s;
        }

        .btn-glow:hover::before {
          left: 100%;
        }

        .btn-glow:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 30px rgba(0, 255, 136, 0.8);
        }

        .stats-card {
          background: rgba(10, 14, 39, 0.8);
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 20px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
          color: #fff;
        }

        .stats-card:hover {
          transform: translateY(-10px);
          border-color: var(--primary);
          box-shadow: 0 10px 40px rgba(0, 255, 136, 0.3);
        }

        .stats-number {
          font-size: 3rem;
          font-weight: bold;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .roadmap-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .roadmap-card {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1));
          border: 2px solid rgba(0, 255, 136, 0.3);
          border-radius: 20px;
          padding: 2.5rem;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 255, 136, 0.2);
          position: relative;
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .roadmap-title {
          color: var(--primary);
          font-size: 1.8rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .roadmap-title i {
          font-size: 2rem;
        }

        .roadmap-arrow {
          color: var(--accent);
          font-size: 1.5rem;
          margin-left: 0.5rem;
        }

        .roadmap-steps {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .roadmap-step {
          background: rgba(255, 255, 255, 0.05);
          border-left: 4px solid var(--primary);
          padding: 1rem 1.25rem;
          border-radius: 8px;
          color: #fff;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          position: relative;
          padding-left: 2.5rem;
        }

        .roadmap-step::before {
          content: '✓';
          position: absolute;
          left: 0.8rem;
          color: var(--primary);
          font-weight: bold;
          font-size: 1.1rem;
        }

        .roadmap-step:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(5px);
          border-left-color: var(--accent);
        }

        .roadmap-step:last-child {
          border-left-color: var(--accent);
        }

        .roadmap-step:last-child::before {
          content: '🎯';
          font-size: 1rem;
        }

        .roadmap-close {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        .roadmap-close:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .flip-card-wrapper {
          perspective: 1000px;
          min-height: 400px;
          width: 100%;
          margin-bottom: 2rem;
        }

        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 400px;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }

        .flip-card-inner.flipped {
          transform: rotateY(180deg);
        }

        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          min-height: 400px;
          top: 0;
          left: 0;
          backface-visibility: hidden;
        }

        .flip-card-front {
          z-index: 2;
        }

        .flip-card-back {
          transform: rotateY(180deg);
          z-index: 1;
        }

        .flip-card-back-content {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1));
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          height: 100%;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          justify-content: space-between;
        }

        .flip-roadmap-title {
          color: var(--primary);
          font-size: 1.4rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .flip-roadmap-title i {
          font-size: 1.6rem;
        }

        .flip-roadmap-steps {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
          justify-content: center;
        }

        .flip-roadmap-step {
          color: rgba(255, 255, 255, 0.85);
          font-size: 1.05rem;
          padding-left: 1.5rem;
          position: relative;
          line-height: 1.6;
        }

        .flip-roadmap-step::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--primary);
          font-weight: bold;
        }

        .flip-roadmap-step:last-child::before {
          content: '🎯';
        }

        .feature-card {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.05), rgba(0, 212, 255, 0.05));
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 20px;
          padding: 2.5rem;
          height: 100%;
          transition: all 0.4s;
          position: relative;
          overflow: hidden;
          color: #fff;
        }

        .feature-card h3 {
          color: #fff;
        }

        .feature-card p {
          color: #fff;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(0, 255, 136, 0.1), transparent 70%);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-card:hover {
          transform: translateY(-15px) scale(1.02);
          border-color: var(--primary);
          box-shadow: 0 20px 60px rgba(0, 255, 136, 0.3);
        }

        .feature-icon {
          font-size: 3.5rem;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .level-progress {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50px;
          height: 30px;
          overflow: hidden;
          margin: 1rem 0;
          border: 1px solid rgba(0, 255, 136, 0.3);
        }

        .progress-bar-glow {
          background: linear-gradient(90deg, var(--secondary), var(--primary));
          height: 100%;
          border-radius: 50px;
          transition: width 1s ease;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
          }
          50% { 
            opacity: 0.7; 
          }
        }

        .game-card {
          background: rgba(10, 14, 39, 0.9);
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 15px;
          padding: 0;
          overflow: hidden;
          transition: all 0.4s;
          cursor: pointer;
          color: #fff;
        }

        .game-card:hover {
          transform: translateY(-10px);
          border-color: var(--primary);
          box-shadow: 0 15px 50px rgba(0, 255, 136, 0.4);
        }

        .game-img {
          height: 200px;
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(255, 0, 128, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          border-bottom: 2px solid rgba(0, 255, 136, 0.2);
        }

        .game-body {
          padding: 1.5rem;
        }

        .game-body h4 {
          color: #fff;
        }

        .game-body p {
          color: #fff;
        }

        .badge-level {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: bold;
          color: #000;
        }

        .footer {
          background: var(--dark);
          border-top: 2px solid rgba(0, 255, 136, 0.2);
          padding: 3rem 0;
          margin-top: 5rem;
          color: #fff;
        }

        .footer h4,
        .footer h5 {
          color: #fff;
        }

        .footer p {
          color: #fff;
        }

        .social-icon {
          font-size: 1.5rem;
          margin: 0 1rem;
          color: var(--primary);
          transition: all 0.3s;
          text-decoration: none;
        }

        .social-icon:hover {
          color: var(--accent);
          transform: translateY(-5px);
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0); 
          }
          50% { 
            transform: translateY(-20px); 
          }
        }

        .floating {
          animation: float 3s ease-in-out infinite;
        }

        .section-title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 3rem;
          text-align: center;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .glitch {
            font-size: 3rem;
          }

          .section-title {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .glitch {
            font-size: 2.5rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .feature-icon {
            font-size: 2.5rem;
          }

          .stats-number {
            font-size: 2rem;
          }

          .floating i {
            font-size: 8rem !important;
          }
        }

        @media (max-width: 576px) {
          .hero {
            padding: 100px 0 60px;
          }

          .glitch {
            font-size: 2rem;
            
          }

          .floating i {
            font-size: 6rem !important;
          }

          .btn-glow {
            padding: 12px 30px;
            font-size: 1rem;
          }
        }
      `}</style>

      <canvas className="matrix-bg" id="matrix"></canvas>

      <Navbar />

      <section className="hero">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 hero-content">
              <h1 className="glitch">Level Up Your Cyber Skills</h1>
              <p
                className="lead mb-4"
                style={{ fontSize: "1.3rem", color: "rgba(255,255,255,0.8)" }}
              >
                Master cybersecurity through immersive gaming experiences. Hack,
                defend, and conquer your way to becoming a security expert.
              </p>
              <a className="btn btn-glow me-3" href="Login">Begin Journey</a>


              <div className="level-progress mt-5">
                <div
                  className="progress-bar-glow"
                  style={{ width: `${heroProgress}%` }}
                ></div>
              </div>
              <p className="mt-2" style={{ color: "#fff" }}>
                <strong>Level 1</strong> - Complete challenges to unlock new
                skills
              </p>
            </div>
            <div className="col-lg-6">
              <div className="floating text-center">
                <i
                  className="fas fa-laptop-code"
                  style={{
                    fontSize: "15rem",
                    color: "var(--primary)",
                    opacity: 0.3,
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5" style={{ position: "relative", zIndex: 2 }}>
        <div className="container">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="stats-card">
                <i
                  className="fas fa-flag-checkered"
                  style={{
                    fontSize: "2.5rem",
                    color: "var(--primary)",
                    marginBottom: "1rem",
                  }}
                ></i>
                <div className="stats-number" data-target="1200">
                  0
                </div>
                <p className="mb-0">Missions Available</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stats-card">
                <i
                  className="fas fa-star"
                  style={{
                    fontSize: "2.5rem",
                    color: "var(--accent)",
                    marginBottom: "1rem",
                  }}
                ></i>
                <div className="stats-number" data-target="75000">
                  0
                </div>
                <p className="mb-0">XP Earns</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="py-5"
        style={{ position: "relative", zIndex: 2 }}
      >
        <div className="container">
          <h2 className="section-title">Master Cybersecurity Through Play</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-gamepad"></i>
                </div>
                <h3>Interactive Challenges</h3>
                <p>
                  Engage with real-world scenarios in a gamified environment.
                  From SQL injection to network defense, learn by doing.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3>Progress Tracking</h3>
                <p>
                  Monitor your skill development with detailed analytics. Earn
                  XP, unlock achievements, and climb the leaderboard.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <div className="feature-icon">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <h3>Expert-Led Content</h3>
                <p>
                  Learn from industry professionals with years of experience in
                  cybersecurity and ethical hacking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="challenges"
        className="py-5"
        style={{ position: "relative", zIndex: 2 }}
      >
        <div className="container">
          <h2 className="section-title">Popular Challenges</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="flip-card-wrapper">
                <div className={`flip-card-inner ${flipped === 'bugbounty' ? 'flipped' : ''}`}>
                  <div className="flip-card-front">
                    <div className="game-card" onClick={() => setFlipped(flipped === 'bugbounty' ? null : 'bugbounty')} style={{ cursor: 'pointer' }}>
                      <div className="game-img">
                        <i
                          className="fas fa-bug"
                          style={{ color: "var(--secondary)" }}
                        ></i>
                      </div>
                      <div className="game-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge-level">Beginner</span>
                          <span style={{ color: "var(--primary)" }}>
                            <i className="fas fa-star"></i> 4.8
                          </span>
                        </div>
                        <h4>Bug Bounty Hunter</h4>
                        <p>
                          Find and exploit vulnerabilities in web applications. Learn
                          OWASP Top 10 through hands-on practice.
                        </p>
                        <div className="d-flex justify-content-between mt-3">
                          
                          <span>
                            <i className="fas fa-users"></i> 12.5k
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flip-card-back">
                    <div className="flip-card-back-content" onClick={() => setFlipped(null)}>
                      <div className="flip-roadmap-title">
                        <i className="fas fa-bug"></i> Roadmap
                      </div>
                      <div className="flip-roadmap-steps">
                        {challengeRoadmaps.bugbounty.map((step, idx) => (
                          <div key={idx} className="flip-roadmap-step">{step}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="flip-card-wrapper">
                <div className={`flip-card-inner ${flipped === 'network' ? 'flipped' : ''}`}>
                  <div className="flip-card-front">
                    <div className="game-card" onClick={() => setFlipped(flipped === 'network' ? null : 'network')} style={{ cursor: 'pointer' }}>
                      <div className="game-img">
                        <i
                          className="fas fa-network-wired"
                          style={{ color: "var(--accent)" }}
                        ></i>
                      </div>
                      <div className="game-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge-level">Intermediate</span>
                          <span style={{ color: "var(--primary)" }}>
                            <i className="fas fa-star"></i> 4.9
                          </span>
                        </div>
                        <h4>Network Guardian</h4>
                        <p>
                          Defend against network attacks. Master firewalls, IDS/IPS,
                          and network segmentation strategies.
                        </p>
                        <div className="d-flex justify-content-between mt-3">
                          
                          <span>
                            <i className="fas fa-users"></i> 8.2k
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flip-card-back">
                    <div className="flip-card-back-content" onClick={() => setFlipped(null)}>
                      <div className="flip-roadmap-title">
                        <i className="fas fa-network-wired"></i> Roadmap
                      </div>
                      <div className="flip-roadmap-steps">
                        {challengeRoadmaps.network.map((step, idx) => (
                          <div key={idx} className="flip-roadmap-step">{step}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="flip-card-wrapper">
                <div className={`flip-card-inner ${flipped === 'crypto' ? 'flipped' : ''}`}>
                  <div className="flip-card-front">
                    <div className="game-card" onClick={() => setFlipped(flipped === 'crypto' ? null : 'crypto')} style={{ cursor: 'pointer' }}>
                      <div className="game-img">
                        <i
                          className="fas fa-lock"
                          style={{ color: "var(--primary)" }}
                        ></i>
                      </div>
                      <div className="game-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="badge-level">Advanced</span>
                          <span style={{ color: "var(--primary)" }}>
                            <i className="fas fa-star"></i> 5.0
                          </span>
                        </div>
                        <h4>Cryptography Master</h4>
                        <p>
                          Break codes and implement secure encryption. Dive deep into
                          modern cryptographic algorithms.
                        </p>
                        <div className="d-flex justify-content-between mt-3">
                        
                          <span>
                            <i className="fas fa-users"></i> 5.1k
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flip-card-back">
                    <div className="flip-card-back-content" onClick={() => setFlipped(null)}>
                      <div className="flip-roadmap-title">
                        <i className="fas fa-lock"></i> Roadmap
                      </div>
                      <div className="flip-roadmap-steps">
                        {challengeRoadmaps.crypto.map((step, idx) => (
                          <div key={idx} className="flip-roadmap-step">{step}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="row">
            <div className="col-md-4">
              <h4 style={{ color: "var(--primary)" }}>
                <i className="fas fa-shield-alt"></i> CyberQuest
              </h4>
              <p className="mt-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                Empowering the next generation of cybersecurity professionals
                through gamified learning.
              </p>
            </div>
            <div className="col-md-4">
              <h5>Quick Links</h5>
              <ul className="list-unstyled mt-3">
                <li className="mb-2">
                  <Link
                    to="/about"
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      textDecoration: "none",
                    }}
                  >
                    About Us
                  </Link>
                </li>
                
                <li className="mb-2">
                  <Link
                    to="/contact"
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      textDecoration: "none",
                    }}
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5>Legal & Support</h5>
              <ul className="list-unstyled mt-3">
                <li className="mb-2">
                  <Link
                    to="/privacy"
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      textDecoration: "none",
                    }}
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/terms"
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      textDecoration: "none",
                    }}
                  >
                    Terms of Service
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    to="/faq"
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      textDecoration: "none",
                    }}
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <hr
            style={{
              borderColor: "rgba(0, 255, 136, 0.2)",
              margin: "2rem 0",
            }}
          />
          <div className="text-center">
            <p>&copy; 2026 CyberQuest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}