import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function TermsOfService() {
  return (
    <>
      <Navbar />
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
        color: "#fff",
        paddingTop: "100px",
        paddingBottom: "50px"
      }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              color: "var(--primary)",
              textDecoration: "none",
              marginBottom: "2rem",
              fontSize: "1rem",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => e.target.style.transform = "translateX(-5px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateX(0)"}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: "8px" }}></i>
            Back to Home
          </Link>
          <h1 style={{
            textAlign: "center",
            marginBottom: "2rem",
            color: "var(--primary)",
            fontSize: "2.5rem"
          }}>
            Terms of Service
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: "3rem" }}>
            Last Updated: January 20, 2026
          </p>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>1. Acceptance of Terms</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              By accessing and using CyberQuest, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>2. User Accounts</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              You are responsible for:
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8" }}>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>3. Acceptable Use</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              You agree NOT to:
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8" }}>
              <li>Use the platform for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to any part of the platform</li>
              <li>Share solutions to missions publicly or assist in cheating</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Scrape or extract data through automated means</li>
              <li>Impersonate others or create fake accounts</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>4. Learning Environment</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              CyberQuest provides a controlled educational environment. All hacking and security testing activities must be confined to the platform's designated missions and challenges. Any attempt to attack the platform infrastructure or other users is strictly prohibited.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>5. Intellectual Property</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              All content on CyberQuest, including missions, challenges, graphics, and code, is owned by CyberQuest or its licensors and is protected by copyright and intellectual property laws.
            </p>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8", marginTop: "1rem" }}>
              You retain ownership of content you create, but grant us a license to use, display, and distribute it as necessary to operate the platform.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>6. Leaderboards and Achievements</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              We reserve the right to:
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8" }}>
              <li>Remove suspicious scores or achievements</li>
              <li>Investigate potential cheating or misconduct</li>
              <li>Reset progress if violations are detected</li>
              <li>Update scoring algorithms and difficulty ratings</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>7. Disclaimer of Warranties</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              CyberQuest is provided "as is" without warranties of any kind. We do not guarantee that the platform will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>8. Limitation of Liability</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              CyberQuest and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>9. Termination</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              We reserve the right to suspend or terminate your account at any time for violations of these terms. You may terminate your account at any time through your profile settings.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>10. Changes to Terms</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              We may update these Terms of Service from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>11. Contact Information</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              For questions about these Terms of Service, contact us at:
              <br /><br />
              Email: <span style={{ color: "var(--primary)" }}>legal@cyberquest.com</span>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
