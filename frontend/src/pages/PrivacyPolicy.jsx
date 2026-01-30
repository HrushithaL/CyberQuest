
import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: "3rem" }}>
            Last Updated: January 20, 2026
          </p>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>1. Information We Collect</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              We collect information you provide directly to us, including:
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8" }}>
              <li>Account information (username, email address, password)</li>
              <li>Profile information (display name, avatar, bio)</li>
              <li>Progress data (completed missions, scores, achievements)</li>
              <li>User-generated content (mission submissions, comments)</li>
              <li>Communication data (support tickets, feedback)</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>2. How We Use Your Information</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              We use the information we collect to:
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8" }}>
              <li>Provide, maintain, and improve our services</li>
              <li>Track your learning progress and achievements</li>
              <li>Generate personalized learning recommendations</li>
              <li>Display leaderboards and user rankings</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>3. Information Sharing</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8" }}>
              <li>With your consent</li>
              <li>With service providers who assist in operating our platform</li>
              <li>To comply with legal obligations</li>
              <li>Public information (username, scores) displayed on leaderboards</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>4. Data Security</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              We implement industry-standard security measures to protect your information, including:
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8" }}>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication systems</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>5. Your Rights</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              You have the right to:
            </p>
            <ul style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.8" }}>
              <li>Access your personal information</li>
              <li>Update or correct your information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>6. Cookies and Tracking</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              We use cookies and similar technologies to maintain your session, remember your preferences, and analyze platform usage. You can control cookie settings through your browser.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>7. Children's Privacy</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              Our platform is intended for users aged 13 and above. We do not knowingly collect information from children under 13. If you believe a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ color: "var(--primary)", marginBottom: "1rem" }}>8. Contact Us</h2>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.8" }}>
              If you have questions about this Privacy Policy, please contact us at:
              <br /><br />
              Email: <span style={{ color: "var(--primary)" }}>privacy@cyberquest.com</span>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
