import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRegister } from "../utils/api";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    skillLevel: "",
  });

  const [strengthClass, setStrengthClass] = useState("");
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // -------------------------------------------------
  // MATRIX BACKGROUND
  // -------------------------------------------------
  useEffect(() => {
    const canvas = document.getElementById("matrix");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const chars = "01アイウエオカキクケコサシスセソタチツテト";
    const fontSize = 14;
    let columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function drawMatrix() {
      ctx.fillStyle = "rgba(5, 8, 22, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff88";
      ctx.font = fontSize + "px monospace";

      drops.forEach((y, index) => {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, index * fontSize, y * fontSize);

        if (y * fontSize > canvas.height && Math.random() > 0.975) {
          drops[index] = 0;
        }
        drops[index]++;
      });
    }

    const interval = setInterval(drawMatrix, 35);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------
  // HANDLE FORM INPUT
  // -------------------------------------------------
  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // -------------------------------------------------
  // PASSWORD STRENGTH CHECKER
  // -------------------------------------------------
  function checkStrength(password) {
    const reqs = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setRequirements(reqs);

    const count = Object.values(reqs).filter(Boolean).length;
    if (count <= 2) setStrengthClass("strength-weak");
    else if (count === 3) setStrengthClass("strength-medium");
    else setStrengthClass("strength-strong");
  }

  // -------------------------------------------------
  // SUBMIT REGISTRATION
  // -------------------------------------------------
  async function handleRegister(e) {
    e.preventDefault();

    // Front-end validation
    if (!form.username || form.username.length < 3) {
      return setAlertMessage("Username must be at least 3 characters.");
    }
    if (!form.email.includes("@")) {
      return setAlertMessage("Enter a valid email address.");
    }
    if (form.password !== form.confirmPassword) {
      return setAlertMessage("Passwords do not match.");
    }

    setIsLoading(true);

    try {
      const payload = {
        name: form.username,
        email: form.email,
        password: form.password,
        skillLevel: form.skillLevel,
      };

      const res = await apiRegister(payload);
      if (res.token && res.user) {
        login(res.user, res.token);
        setAlertMessage("Registration successful! Redirecting... ");
        setTimeout(() => nav("/missions"), 1000);
      } else {
        setAlertMessage("Registration successful! Redirecting to login...");
        setTimeout(() => nav("/login"), 1200);
      }

    } catch (err) {
      setAlertMessage(err.message);
    }

    setIsLoading(false);
  }

  // -------------------------------------------------
  // SOCIAL LOGIN HANDLER
  // -------------------------------------------------
  const handleSocialLogin = (provider) => {
    const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };
  return (
    <>
      <canvas id="matrix" className="matrix-bg"></canvas>

      <Link to="/" className="back-home">
        <i className="fas fa-arrow-left"></i> Back to Home
      </Link>

      {/* Styling inside component */}
      <style>{`
        /* Theme variables and base body background moved to src/styles/theme.css */
        body { color:white; }
        .matrix-bg {
          position: fixed; left:0; top:0;
          width:100%; height:100%;
          z-index:0; opacity:0.1;
        }
        .back-home {
          position: fixed; top:20px; left:20px;
          color: var(--primary); text-decoration:none;
        }
        .register-container {
          position:relative; z-index:2;
          max-width:500px; margin:auto; padding-top:100px;
        }
        .register-card {
          background:rgba(10,14,39,0.9);
          padding:35px; border-radius:25px;
          border:2px solid rgba(0,255,136,0.3);
        }
        .logo h1 {
          font-size:2.5rem;
          background:linear-gradient(135deg,var(--primary),var(--accent));
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
        }
        .form-control, .form-select {
          background:rgba(0,0,0,0.3); color:white;
          border-radius:15px; padding:12px;
          border:2px solid rgba(0,255,136,0.2);
        }
        .btn-register {
          width:100%; padding:14px;
          background:linear-gradient(135deg,var(--primary),var(--accent));
          border:none; border-radius:15px;
          font-size:1.2rem; margin-top:20px;
        }
        .password-strength-bar { height:5px; transition:0.3s; }
        .strength-weak { background:#ff0080; width:33%; }
        .strength-medium { background:#ffa500; width:66%; }
        .strength-strong { background:#00ff88; width:100%; }
        .alert-box {
          background:rgba(255,0,128,0.2);
          border:2px solid rgba(255,0,128,0.3);
          padding:10px; border-radius:10px;
          color:white; margin-bottom:15px;
        }
      `}</style>

      <div className="register-container">
        <div className="register-card">

          <div className="logo text-center">
            <h1><i className="fas fa-shield-alt"></i> CyberQuest</h1>
            <p>Join the elite cyber warriors</p>
          </div>

          {alertMessage && <div className="alert-box">{alertMessage}</div>}

          <form onSubmit={handleRegister}>
            
            <label className="form-label">Username</label>
            <input
              className="form-control mb-3"
              value={form.username}
              onChange={(e) => updateForm("username", e.target.value)}
            />

            <label className="form-label">Email</label>
            <input
              className="form-control mb-3"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
            />

            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => {
                updateForm("password", e.target.value);
                checkStrength(e.target.value);
              }}
            />

            <div className="password-strength">
              <div className={`password-strength-bar ${strengthClass}`}></div>
            </div>

            <label className="form-label mt-3">Confirm Password</label>
            <input
              type="password"
              className="form-control mb-3"
              value={form.confirmPassword}
              onChange={(e) => updateForm("confirmPassword", e.target.value)}
            />

            <label className="form-label">Skill Level</label>
            <select
              className="form-select"
              value={form.skillLevel}
              onChange={(e) => updateForm("skillLevel", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>

            <button className="btn-register" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create My Account"}
            </button>

            <div style={{ textAlign: "center", margin: "20px 0", fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
              <span>OR CONTINUE WITH</span>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button type="button" className="btn-social" onClick={() => handleSocialLogin("google")} title="Register with Google" style={{ width: "50px", height: "50px", padding: "0", borderRadius: "12px", background: "rgba(0,255,136,0.1)", border: "2px solid rgba(0,255,136,0.3)", cursor: "pointer", fontSize: "1.5rem" }}>
                <i className="fab fa-google"></i>
              </button>
              <button type="button" className="btn-social" onClick={() => handleSocialLogin("github")} title="Register with GitHub" style={{ width: "50px", height: "50px", padding: "0", borderRadius: "12px", background: "rgba(0,255,136,0.1)", border: "2px solid rgba(0,255,136,0.3)", cursor: "pointer", fontSize: "1.5rem" }}>
                <i className="fab fa-github"></i>
              </button>
              {/* Discord register removed */}
            </div>

            <div className="text-center mt-3">
              Already have an account? <Link to="/login">Login</Link>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
