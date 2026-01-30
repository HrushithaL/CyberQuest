import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "What is CyberQuest?",
      answer: "CyberQuest is a gamified cybersecurity learning platform that helps you develop practical security skills through interactive missions, challenges, and hands-on exercises. Learn by doing in a safe, controlled environment."
    },
    {
      question: "How do I get started?",
      answer: "Simply create a free account, complete your profile, and start with beginner-level missions. Follow the learning roadmap to progress through different security topics at your own pace."
    },
    {
      question: "What types of missions are available?",
      answer: "We offer various mission types including Web Security, Network Security, Cryptography, Forensics, Reverse Engineering, and more. Each mission is designed to teach specific security concepts and techniques."
    },
    {
      question: "How does the scoring system work?",
      answer: "You earn points by completing missions. Scores are based on accuracy, time taken, and difficulty level. Bonus points are awarded for first-time completions and creative solutions."
    },
    {
      question: "What is the leaderboard?",
      answer: "The leaderboard displays top users based on their total points, completed missions, and achievements. It's updated in real-time and helps you track your progress against other learners."
    },
    {
      question: "Can I reset my progress?",
      answer: "While you can't reset your entire progress, you can retake missions to improve your score. Contact support if you need to reset your account completely."
    },
    {
      question: "What are badges and achievements?",
      answer: "Badges are earned by completing specific challenges, reaching milestones, or demonstrating mastery in particular security domains. They showcase your skills and progress."
    },
    {
      question: "Is there a cost to use CyberQuest?",
      answer: "CyberQuest offers a free tier with access to basic missions and features. Premium subscriptions unlock advanced content, detailed analytics, and exclusive challenges."
    },
    {
      question: "What if I get stuck on a mission?",
      answer: "Each mission includes hints that you can unlock. We also have a community forum where you can discuss strategies (without sharing direct solutions). Our support team is available to help."
    },
    {
      question: "Are the missions beginner-friendly?",
      answer: "Yes! We have missions for all skill levels, from absolute beginners to advanced security professionals. The roadmap guides you through progressively challenging content."
    },
    {
      question: "How is my data protected?",
      answer: "We take security seriously. All data is encrypted, and we follow industry best practices. Review our Privacy Policy for detailed information about data handling."
    },
    {
      question: "Can I use CyberQuest for certification preparation?",
      answer: "Absolutely! Many missions align with popular security certifications like CEH, CompTIA Security+, and OSCP. The hands-on practice complements certification study."
    },
    {
      question: "Is there a mobile app?",
      answer: "Currently, CyberQuest is optimized for web browsers on desktop and tablets. Some missions require specific tools best suited for desktop environments."
    },
    {
      question: "How often is new content added?",
      answer: "We regularly add new missions, challenges, and features. Premium members get early access to new content. Subscribe to our newsletter for updates."
    },
    {
      question: "Can I contribute missions or challenges?",
      answer: "We welcome community contributions! Contact us through the support page if you're interested in creating content or providing feedback on existing missions."
    }
  ];

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
            marginBottom: "1rem",
            color: "var(--primary)",
            fontSize: "2.5rem"
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{ 
            color: "rgba(255,255,255,0.6)", 
            textAlign: "center", 
            marginBottom: "3rem",
            fontSize: "1.1rem"
          }}>
            Find answers to common questions about CyberQuest
          </p>

          <div style={{ marginTop: "2rem" }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "10px",
                  marginBottom: "1rem",
                  border: "1px solid rgba(0, 255, 136, 0.1)",
                  overflow: "hidden",
                  transition: "all 0.3s ease"
                }}
              >
                <div
                  onClick={() => toggleFAQ(index)}
                  style={{
                    padding: "1.2rem 1.5rem",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: activeIndex === index ? "rgba(0, 255, 136, 0.05)" : "transparent"
                  }}
                >
                  <h3 style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    color: activeIndex === index ? "var(--primary)" : "#fff",
                    fontWeight: "500"
                  }}>
                    {faq.question}
                  </h3>
                  <span style={{
                    fontSize: "1.5rem",
                    color: "var(--primary)",
                    transform: activeIndex === index ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform 0.3s ease"
                  }}>
                    +
                  </span>
                </div>
                {activeIndex === index && (
                  <div style={{
                    padding: "0 1.5rem 1.2rem 1.5rem",
                    color: "rgba(255,255,255,0.7)",
                    lineHeight: "1.8",
                    animation: "fadeIn 0.3s ease"
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{
            textAlign: "center",
            marginTop: "3rem",
            padding: "2rem",
            background: "rgba(0, 255, 136, 0.05)",
            borderRadius: "10px",
            border: "1px solid rgba(0, 255, 136, 0.2)"
          }}>
            <h3 style={{ color: "var(--primary)", marginBottom: "1rem" }}>
              Still have questions?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem" }}>
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <a
              href="/contact"
              style={{
                display: "inline-block",
                padding: "12px 30px",
                background: "var(--primary)",
                color: "#000",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: "600",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 5px 15px rgba(0, 255, 136, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
      <style>{`
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
      `}</style>
    </>
  );
}
