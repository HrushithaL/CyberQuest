import React, { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { apiSubmitContactMessage, apiGetUserContactMessages } from "../utils/api";

export default function Contact() {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userMessages, setUserMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState("form");

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  // Fetch user's message history if logged in
  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;
      setLoadingMessages(true);
      try {
        const messages = await apiGetUserContactMessages();
        setUserMessages(messages);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [user, isSubmitted]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiSubmitContactMessage(formData);
      setIsSubmitted(true);
      setFormData({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err) {
      console.error("Error submitting contact message:", err);
      setError(err.response?.data?.error || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .contact-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #050816 0%, #0a0e27 50%, #1a1a3e 100%);
          color: #fff;
          padding-top: 100px;
        }

        .hero-section {
          padding: 80px 0 60px;
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
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.8;
          position: relative;
          z-index: 1;
        }

        .contact-section {
          padding: 60px 0 100px;
        }

        .contact-card {
          background: rgba(10, 14, 39, 0.8);
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 24px;
          padding: 3rem;
          backdrop-filter: blur(10px);
          height: 100%;
        }

        .contact-info-card {
          transition: all 0.4s ease;
        }

        .contact-info-card:hover {
          border-color: #00ff88;
          transform: translateY(-5px);
          box-shadow: 0 20px 60px rgba(0, 255, 136, 0.15);
        }

        .section-title {
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 2rem;
        }

        .contact-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(0, 255, 136, 0.05);
          border-radius: 16px;
          transition: all 0.3s ease;
        }

        .contact-item:hover {
          background: rgba(0, 255, 136, 0.1);
          transform: translateX(10px);
        }

        .contact-item:last-child {
          margin-bottom: 0;
        }

        .contact-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: #050816;
          flex-shrink: 0;
          margin-right: 1.5rem;
        }

        .contact-details h4 {
          font-size: 1.2rem;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .contact-details p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.6;
        }

        .contact-details a {
          color: #00ff88;
          text-decoration: none;
          transition: color 0.3s;
        }

        .contact-details a:hover {
          color: #00d4ff;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-control {
          width: 100%;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(0, 255, 136, 0.2);
          border-radius: 12px;
          color: #fff;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-control::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .form-control:focus {
          outline: none;
          border-color: #00ff88;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);
          background: rgba(0, 0, 0, 0.4);
        }

        textarea.form-control {
          min-height: 150px;
          resize: vertical;
        }

        .btn-submit {
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          border: none;
          padding: 16px 45px;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: 50px;
          color: #000;
          cursor: pointer;
          width: 100%;
          transition: all 0.3s ease;
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
          position: relative;
          overflow: hidden;
        }

        .btn-submit::before {
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

        .btn-submit:hover::before {
          left: 100%;
        }

        .btn-submit:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 40px rgba(0, 255, 136, 0.5);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .success-message {
          background: rgba(0, 255, 136, 0.1);
          border: 2px solid #00ff88;
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          margin-bottom: 2rem;
          animation: fadeIn 0.5s ease;
        }

        .success-message i {
          font-size: 2.5rem;
          color: #00ff88;
          margin-bottom: 1rem;
        }

        .success-message h4 {
          color: #00ff88;
          margin-bottom: 0.5rem;
        }

        .success-message p {
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .social-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(0, 255, 136, 0.2);
        }

        .social-title {
          font-size: 1.2rem;
          color: #fff;
          margin-bottom: 1.5rem;
        }

        .social-links {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          width: 50px;
          height: 50px;
          background: rgba(0, 255, 136, 0.1);
          border: 2px solid rgba(0, 255, 136, 0.3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          color: #00ff88;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .social-link:hover {
          background: #00ff88;
          color: #050816;
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }

        .faq-section {
          padding: 80px 0;
          background: rgba(0, 0, 0, 0.2);
        }

        .faq-title {
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 3rem;
          text-align: center;
        }

        .faq-item {
          background: rgba(10, 14, 39, 0.8);
          border: 2px solid rgba(0, 255, 136, 0.15);
          border-radius: 16px;
          padding: 1.5rem 2rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .faq-item:hover {
          border-color: rgba(0, 255, 136, 0.4);
        }

        .faq-question {
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
        }

        .faq-question i {
          color: #00ff88;
          margin-right: 1rem;
        }

        .faq-answer {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.7;
          padding-left: 2rem;
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

          .contact-card {
            padding: 2rem;
          }

          .contact-item {
            flex-direction: column;
          }

          .contact-icon {
            margin-right: 0;
            margin-bottom: 1rem;
          }
        }
      `}</style>

      <Navbar />

      <div className="contact-page">
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
            <h1 className="page-title">Get in Touch</h1>
            <p className="page-subtitle">
              Have questions about CyberQuest? Want to partner with us?
              We'd love to hear from you. Reach out and our team will
              get back to you within 24 hours.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <div className="container">
            <div className="row g-4">
              {/* Contact Information */}
              <div className="col-lg-5">
                <div className="contact-card contact-info-card">
                  <h3 className="section-title">Contact Information</h3>

                  <div className="contact-item">
                    <div className="contact-icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="contact-details">
                      <h4>Email Us</h4>
                      <p>
                        <a href="mailto:admin@cybergame.com">admin@cybergame.com</a>

                      </p>
                    </div>
                  </div>

                  <div className="contact-item">
                    <div className="contact-icon">
                      <i className="fas fa-phone-alt"></i>
                    </div>
                    <div className="contact-details">
                      <h4>Call Us</h4>
                      <p>
                        +91 9876543210
                        <br />
                        Mon - Fri, 9am - 6pm
                      </p>
                    </div>
                  </div>

                  <div className="contact-item">
                    <div className="contact-icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="contact-details">
                      <h4>Visit Us</h4>
                      <p>
                        Srinagar
                        <br />
                        Bangalore , Karnataka 560050
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="col-lg-7">
                <div className="contact-card">
                  <h3 className="section-title">Send Us a Message</h3>

                  {isSubmitted && (
                    <div className="success-message">
                      <i className="fas fa-check-circle"></i>
                      <h4>Message Sent Successfully!</h4>
                      <p>Thank you for contacting us. We'll get back to you soon.</p>
                    </div>
                  )}

                  {error && (
                    <div className="error-message" style={{
                      background: 'rgba(255, 0, 128, 0.1)',
                      border: '2px solid #ff0080',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      marginBottom: '2rem',
                      animation: 'fadeIn 0.5s ease'
                    }}>
                      <i className="fas fa-exclamation-circle" style={{ fontSize: '2rem', color: '#ff0080', marginBottom: '0.5rem' }}></i>
                      <p style={{ color: '#ff0080', margin: 0 }}>{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Your Name</label>
                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-label">Email Address</label>
                          <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        className="form-control"
                        placeholder="How can we help you?"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Message</label>
                      <textarea
                        name="message"
                        className="form-control"
                        placeholder="Tell us more about your inquiry..."
                        value={formData.message}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                      ></textarea>
                    </div>

                    <button type="submit" className="btn-submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          Send Message
                        </>
                      )}
                    </button>
                  </form>

                  {/* Message History Section - Only for logged in users */}
                  {user && userMessages.length > 0 && (
                    <div style={{ marginTop: '40px', borderTop: '2px solid rgba(0,255,136,0.2)', paddingTop: '30px' }}>
                      <h3 className="section-title" style={{ marginBottom: '20px' }}>
                        📬 Your Message History
                      </h3>

                      {loadingMessages ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#00ff88' }}></i>
                          <p style={{ marginTop: '10px', color: 'rgba(255,255,255,0.6)' }}>Loading messages...</p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {userMessages.map((msg, idx) => (
                            <div
                              key={msg._id || idx}
                              style={{
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,255,136,0.2)',
                                overflow: 'hidden'
                              }}
                            >
                              {/* Message Header */}
                              <div style={{
                                background: 'rgba(0,255,136,0.1)',
                                padding: '15px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '10px'
                              }}>
                                <div>
                                  <span style={{ fontWeight: 'bold', color: '#00ff88' }}>{msg.subject}</span>
                                  <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                    {new Date(msg.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric',
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <span style={{
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  textTransform: 'uppercase',
                                  background: msg.status === 'replied' ? 'rgba(0,255,136,0.2)' :
                                    msg.status === 'read' ? 'rgba(255,165,0,0.2)' : 'rgba(255,0,128,0.2)',
                                  color: msg.status === 'replied' ? '#00ff88' :
                                    msg.status === 'read' ? '#ffa500' : '#ff0080'
                                }}>
                                  {msg.status === 'replied' ? '✓ Replied' :
                                    msg.status === 'read' ? '👁 Read' : '⏳ Pending'}
                                </span>
                              </div>

                              {/* Your Message */}
                              <div style={{ padding: '20px' }}>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                                  Your message:
                                </p>
                                <p style={{
                                  color: 'rgba(255,255,255,0.8)',
                                  lineHeight: '1.6',
                                  whiteSpace: 'pre-wrap'
                                }}>
                                  {msg.message}
                                </p>
                              </div>

                              {/* Admin Reply */}
                              {msg.replyMessage && (
                                <div style={{
                                  background: 'rgba(0,255,136,0.05)',
                                  padding: '20px',
                                  borderTop: '1px solid rgba(0,255,136,0.2)'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <span style={{
                                      width: '32px',
                                      height: '32px',
                                      background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '14px',
                                      fontWeight: 'bold',
                                      color: '#000'
                                    }}>
                                      CQ
                                    </span>
                                    <div>
                                      <p style={{ margin: 0, fontWeight: 'bold', color: '#00ff88' }}>CyberQuest Support</p>
                                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                        {msg.repliedAt && new Date(msg.repliedAt).toLocaleDateString('en-US', {
                                          year: 'numeric', month: 'short', day: 'numeric',
                                          hour: '2-digit', minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div style={{
                                    background: 'rgba(0,255,136,0.1)',
                                    borderLeft: '4px solid #00ff88',
                                    padding: '15px',
                                    borderRadius: '0 8px 8px 0',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap'
                                  }}>
                                    {msg.replyMessage}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="container">
            <h2 className="faq-title">Frequently Asked Questions</h2>
            <div className="row">
              <div className="col-lg-10 mx-auto">
                <div className="faq-item">
                  <div className="faq-question">
                    <i className="fas fa-question-circle"></i>
                    How do I get started with CyberQuest?
                  </div>
                  <div className="faq-answer">
                    Simply create a free account and you'll get immediate access to our
                    beginner-friendly challenges. Complete missions to earn XP and unlock
                    more advanced content as you progress.
                  </div>
                </div>

                <div className="faq-item">
                  <div className="faq-question">
                    <i className="fas fa-question-circle"></i>
                    Is CyberQuest suitable for complete beginners?
                  </div>
                  <div className="faq-answer">
                    Absolutely! We have challenges for all skill levels, from absolute
                    beginners to advanced professionals. Our learning path guides you
                    through the fundamentals before moving to more complex topics.
                  </div>
                </div>

                <div className="faq-item">
                  <div className="faq-question">
                    <i className="fas fa-question-circle"></i>
                    Do I need any special equipment or software?
                  </div>
                  <div className="faq-answer">
                    Most of our challenges run directly in your browser – no special
                    setup required! For advanced simulations, we provide cloud-based
                    virtual environments so you can practice safely.
                  </div>
                </div>

                <div className="faq-item">
                  <div className="faq-question">
                    <i className="fas fa-question-circle"></i>
                    Can I use CyberQuest for my organization's training?
                  </div>
                  <div className="faq-answer">
                    Yes! We offer enterprise plans with team management features,
                    custom learning paths, and detailed analytics. Contact our
                    business team at business@cyberquest.com for more information.
                  </div>
                </div>

                <div className="faq-item">
                  <div className="faq-question">
                    <i className="fas fa-question-circle"></i>
                    Are the certifications recognized by employers?
                  </div>
                  <div className="faq-answer">
                    CyberQuest certificates are recognized by many employers in the
                    industry. Our practical approach to learning means you gain
                    real-world skills that translate directly to job performance.
                  </div>
                </div>
              </div>
            </div>
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
