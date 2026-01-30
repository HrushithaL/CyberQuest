import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function About() {
  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .about-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #050816 0%, #0a0e27 50%, #1a1a3e 100%);
          color: #fff;
          padding-top: 100px;
        }

        .hero-section {
          padding: 80px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 50%, rgba(0, 255, 136, 0.1), transparent 50%),
                      radial-gradient(circle at 70% 80%, rgba(255, 0, 128, 0.08), transparent 50%);
          pointer-events: none;
        }

        .page-title {
          font-size: 3.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .page-subtitle {
          font-size: 1.3rem;
          color: rgba(255, 255, 255, 0.8);
          max-width: 700px;
          margin: 0 auto;
          line-height: 1.8;
          position: relative;
          z-index: 1;
        }

        .content-section {
          padding: 80px 0;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 2rem;
          text-align: center;
        }

        .mission-card {
          background: rgba(10, 14, 39, 0.8);
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 24px;
          padding: 3rem;
          backdrop-filter: blur(10px);
          transition: all 0.4s ease;
        }

        .mission-card:hover {
          border-color: #00ff88;
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0, 255, 136, 0.2);
        }

        .mission-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mission-card h3 {
          font-size: 1.8rem;
          margin-bottom: 1rem;
          color: #fff;
        }

        .mission-card p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.8;
          font-size: 1.1rem;
        }

        .story-section {
          background: linear-gradient(180deg, transparent, rgba(0, 255, 136, 0.03), transparent);
          padding: 100px 0;
        }

        .story-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .story-content p {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 2;
          margin-bottom: 1.5rem;
        }

        .highlight-text {
          color: #00ff88;
          font-weight: 600;
        }

        .value-card {
          background: linear-gradient(135deg, rgba(0, 255, 136, 0.05), rgba(0, 212, 255, 0.05));
          border: 2px solid rgba(0, 255, 136, 0.15);
          border-radius: 20px;
          padding: 2.5rem;
          height: 100%;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .value-card::before {
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

        .value-card:hover::before {
          opacity: 1;
        }

        .value-card:hover {
          transform: translateY(-10px);
          border-color: #00ff88;
          box-shadow: 0 15px 50px rgba(0, 255, 136, 0.25);
        }

        .value-icon {
          font-size: 3rem;
          margin-bottom: 1.5rem;
          color: #00ff88;
        }

        .value-card h4 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #fff;
        }

        .value-card p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.7;
        }

        .cta-section {
          padding: 100px 0;
          text-align: center;
          background: linear-gradient(180deg, transparent, rgba(0, 255, 136, 0.05));
        }

        .cta-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #fff;
        }

        .cta-text {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .btn-glow {
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          border: none;
          padding: 16px 45px;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: 50px;
          color: #000;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s ease;
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.4);
        }

        .btn-glow:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 40px rgba(0, 255, 136, 0.6);
          color: #000;
        }

        .stats-row {
          display: flex;
          justify-content: center;
          gap: 4rem;
          flex-wrap: wrap;
          margin-top: 3rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 3.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 0.5rem;
        }

        .footer {
          background: #050816;
          border-top: 2px solid rgba(0, 255, 136, 0.2);
          padding: 3rem 0;
        }

        .footer-text {
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 2.5rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .stats-row {
            gap: 2rem;
          }

          .stat-number {
            font-size: 2.5rem;
          }
        }
      `}</style>

      <Navbar />

      <div className="about-page">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="container">
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: "var(--primary)",
                textDecoration: "none",
                marginBottom: "2rem",
                fontSize: "1rem",
                transition: "all 0.3s ease",
                position: "relative",
                zIndex: 10
              }}
              onMouseEnter={(e) => e.target.style.transform = "translateX(-5px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateX(0)"}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: "8px" }}></i>
              Back to Home
            </Link>
            <h1 className="page-title">About CyberQuest</h1>
            <p className="page-subtitle">
              We're on a mission to make cybersecurity education accessible, engaging,
              and effective through the power of gamification. Join thousands of learners
              who are leveling up their security skills every day.
            </p>
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Active Learners</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">1200+</div>
                <div className="stat-label">Challenges</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">95%</div>
                <div className="stat-label">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="content-section">
          <div className="container">
            <h2 className="section-title">Our Mission</h2>
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="mission-card">
                  <div className="mission-icon">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <h3>Empower Defenders</h3>
                  <p>
                    We believe everyone deserves access to quality cybersecurity education.
                    Our platform empowers individuals to become digital defenders, protecting
                    themselves and organizations from evolving cyber threats.
                  </p>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="mission-card">
                  <div className="mission-icon">
                    <i className="fas fa-gamepad"></i>
                  </div>
                  <h3>Learn Through Play</h3>
                  <p>
                    Traditional learning can be boring. We've transformed cybersecurity
                    education into an exciting gaming experience where you earn XP,
                    unlock achievements, and compete on leaderboards.
                  </p>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="mission-card">
                  <div className="mission-icon">
                    <i className="fas fa-rocket"></i>
                  </div>
                  <h3>Bridge the Gap</h3>
                  <p>
                    The cybersecurity industry faces a massive skills gap. We're here
                    to bridge that gap by training the next generation of security
                    professionals through hands-on, practical experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="story-section">
          <div className="container">
            <h2 className="section-title">Our Story</h2>
            <div className="story-content">
              <p>
                CyberQuest was born from a simple observation: <span className="highlight-text">
                  traditional cybersecurity training wasn't working</span>. Students were
                disengaged, course completion rates were low, and the skills gap in the
                industry continued to grow.
              </p>
              <p>
                In 2023, a team of cybersecurity professionals and game designers came
                together with a bold idea – what if we could make learning security as
                addictive as playing your favorite video game? What if every vulnerability
                you discovered, every attack you defended, earned you real rewards and recognition?
              </p>
              <p>
                Today, CyberQuest is the <span className="highlight-text">leading gamified
                  cybersecurity learning platform</span>, trusted by students, professionals,
                and enterprises worldwide. Our immersive challenges cover everything from
                basic security hygiene to advanced penetration testing techniques.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="content-section">
          <div className="container">
            <h2 className="section-title">Our Core Values</h2>
            <div className="row g-4">
              <div className="col-md-6 col-lg-3">
                <div className="value-card">
                  <div className="value-icon">
                    <i className="fas fa-lightbulb"></i>
                  </div>
                  <h4>Innovation</h4>
                  <p>
                    We constantly push boundaries to create new and exciting ways
                    to learn cybersecurity.
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="value-card">
                  <div className="value-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <h4>Community</h4>
                  <p>
                    Our learners are part of a global community of security enthusiasts
                    who support each other.
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="value-card">
                  <div className="value-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <h4>Excellence</h4>
                  <p>
                    We're committed to providing the highest quality content created
                    by industry experts.
                  </p>
                </div>
              </div>
              <div className="col-md-6 col-lg-3">
                <div className="value-card">
                  <div className="value-icon">
                    <i className="fas fa-lock-open"></i>
                  </div>
                  <h4>Accessibility</h4>
                  <p>
                    Cybersecurity education should be available to everyone, regardless
                    of background.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <h2 className="cta-title">Ready to Start Your Journey?</h2>
            <p className="cta-text">
              Join thousands of learners who are already leveling up their
              cybersecurity skills with CyberQuest.
            </p>
            <Link to="/register" className="btn-glow">
              Get Started Free
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <p className="footer-text">
              &copy; 2024 CyberQuest. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
