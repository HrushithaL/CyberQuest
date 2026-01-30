import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminNavbar({ activeTab, onTabChange }) {
  const { logout } = useContext(AuthContext);
  const nav = useNavigate();

  return (
    <>
      <style>{`
        .navbar-full.admin {
          width: 100%;
          background: rgba(8, 12, 32, 0.98);
          border-bottom: 2px solid rgba(0, 212, 255, 0.06);
          backdrop-filter: blur(10px);
          position: fixed;
          top: 0;
          left: 0;
          z-index: 999;
          padding: 1rem 0;
        }

        .navbar-inner.admin {
          width: 100%;
          max-width: 1400px;
          margin: auto;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-link.admin {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .brand-logo.admin {
          height: 56px;
          width: auto;
          display: inline-block;
          border-radius: 8px;
        }

        .brand-text.admin {
          font-size: 1.6rem;
          font-weight: bold;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-decoration: none;
        }

        .admin-badge {
          font-size: 0.65rem;
          padding: 3px 8px;
          border-radius: 8px;
          background: var(--primary);
          color: #000;
          font-weight: 700;
          margin-left: 6px;
        }

        .nav-section.admin {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-item-link.admin {
          color: #fff;
          text-decoration: none;
          font-size: 1rem;
          position: relative;
          transition: 0.3s ease;
        }

        .nav-item-link.admin.active {
          color: var(--primary);
          border-bottom: 2px solid var(--primary);
          padding-bottom: 6px;
        }

        .nav-item-link.admin:hover { color: var(--primary); }

        .logout-btn.admin {
          background: transparent;
          border: 2px solid var(--primary);
          padding: 6px 12px;
          color: var(--primary);
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s ease;
        }

        .logout-btn.admin:hover { background: var(--primary); color: black; }

        @media (max-width: 768px) {
          .navbar-inner.admin { padding: 0 20px; }
          .brand-logo.admin { height: 44px; }
        }
      `}</style>

      <nav className="navbar-full admin">
        <div className="navbar-inner admin">
          <Link to="/admin" className="brand-link admin">
            <img src="/logo.svg" alt="CyberQuest logo" className="brand-logo admin" />
            <span className="brand-text admin">CyberQuest</span>
            <span className="admin-badge">ADMIN</span>
          </Link>

          <div className="nav-section admin">
            {[
              { key: 'overview', label: 'Dashboard' },
              { key: 'missions', label: 'Missions' },
              { key: 'users', label: 'Users' },
              { key: 'learn', label: 'Learn' },
              { key: 'messages', label: 'Messages' },
            ].map(tab => (
              <button
                key={tab.key}
                className={`nav-item-link admin ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => onTabChange?.(tab.key)}
                style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                {tab.label}
              </button>
            ))}
            <button
              className="logout-btn admin"
              onClick={() => {
                logout();
                nav('/');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
