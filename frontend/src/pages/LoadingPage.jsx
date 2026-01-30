import React, { useEffect, useState } from "react";

export default function LoadingPage() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev === "..." ? "." : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0a0e27",
        flexDirection: "column",
        gap: "2rem",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 136, 0.3); }
          50% { box-shadow: 0 0 30px rgba(0, 255, 136, 0.8); }
        }

        .loading-logo {
          animation: pulse 2s ease-in-out infinite;
        }

        .loading-container {
          text-align: center;
        }

        .loading-text {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #00ff88, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }

        .loading-message {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
          letter-spacing: 2px;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(0, 255, 136, 0.2);
          border-top: 4px solid #00ff88;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="loading-container">
        <div className="loading-logo">
          <img
            src="/logo.svg"
            alt="CyberQuest"
            style={{ width: "120px", height: "auto" }}
          />
        </div>

        <div className="loading-text">CyberQuest</div>
        <div style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.9rem" }}>
          Level Up Your Security Skills
        </div>
      </div>

      <div className="spinner"></div>

      <div className="loading-message">Loading{dots}</div>
    </div>
  );
}
