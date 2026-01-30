import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();

  return (
    <>
      <style>{`
        /* Theme variables moved to src/styles/theme.css */

        .navbar-full {
          width: 100%;
          background: rgba(10, 14, 39, 0.95);
          border-bottom: 2px solid rgba(0, 255, 136, 0.1);
          backdrop-filter: blur(10px);
          position: fixed;
          top: 0;
          left: 0;
          z-index: 999;
          padding: 0.8rem 0;
        }

        .navbar-inner {
          width: 100%;
          max-width: 1400px;
          margin: auto;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-link {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .brand-logo {
          height: 48px;
          width: auto;
          display: inline-block;
          border-radius: 8px;
        }

        .brand-text {
          font-size: 1.8rem;
          font-weight: bold;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-decoration: none;
        }

        /* GROUPING NAV LINKS INTO A SINGLE FLEX ROW */
        .nav-section {
          display: flex;
          align-items: center;
          gap: 2.5rem;
        }

        .nav-item-link {
          color: #fff;
          text-decoration: none;
          font-size: 1rem;
          position: relative;
          transition: 0.3s ease;
        }

        .nav-item-link:hover {
          color: var(--primary);
        }

        .nav-item-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -4px;
          height: 2px;
          background: var(--primary);
          width: 0%;
          transition: width 0.3s ease;
        }

        .nav-item-link:hover::after {
          width: 100%;
        }

        /* Logout Button */
        .logout-btn {
          background: transparent;
          border: 2px solid var(--primary);
          padding: 6px 15px;
          color: var(--primary);
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s ease;
        }

        .logout-btn:hover {
          background: var(--primary);
          color: black;
        }

        @media (max-width: 768px) {
          .navbar-inner {
            padding: 0 20px;
          }
          .nav-section {
            gap: 1rem;
          }
          .brand-logo {
            height: 36px;
          }
        }
      `}</style>

      <nav className="navbar-full">
        <div className="navbar-inner">

          {/* BRAND */}
          <Link to="/" className="brand-link">
            <img src="/logo.svg" alt="CyberQuest logo" className="brand-logo" />
            <span className="brand-text">CyberQuest</span>
          </Link>

          {/* ALL NAV LINKS IN A SINGLE ROW */}
          <div className="nav-section">

            {user ? (
              <>
                <Link to="/dashboard" className="nav-item-link">Dashboard</Link>
                <Link to="/missions" className="nav-item-link">Missions</Link>
                <Link to="/learn" className="nav-item-link">Roadmap</Link>
                <Link to="/leaderboard" className="nav-item-link">Leaderboard</Link>
                <Link to="/profile" className="nav-item-link">Profile</Link>
                <Link to="/contact" className="nav-item-link">Contact</Link>
                <button
                  className="logout-btn"
                  onClick={() => {
                    logout();
                    nav("/");
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/missions" className="nav-item-link">Missions</Link>
                <Link to="/leaderboard" className="nav-item-link">Leaderboard</Link>
                <Link to="/learn" className="nav-item-link">Roadmap</Link>
                <Link to="/login" className="nav-item-link">Login</Link>
                <Link to="/register" className="nav-item-link">Register</Link>
              </>
            )}

          </div>
        </div>
      </nav>
    </>
  );
}
