import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiLogin } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- FIXED (use login(), not setToken)

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Matrix animation
    const canvas = document.getElementById("matrix");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = "01アイウエオカキクケコサシスセソタチツテト";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function drawMatrix() {
      ctx.fillStyle = "rgba(5, 8, 22, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff88";
      ctx.font = `${fontSize}px monospace`;

      drops.forEach((y, idx) => {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, idx * fontSize, y * fontSize);
        if (y * fontSize > canvas.height && Math.random() > 0.975) drops[idx] = 0;
        drops[idx]++;
      });
    }

    const interval = setInterval(drawMatrix, 35);
    return () => clearInterval(interval);
  }, []);

  const showAlert = (msg) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(""), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return showAlert("Email and password required");
    }

    try {
      setIsLoading(true);

      const res = await apiLogin({ email, password });

      // 🔥 FIX: Save user + token inside AuthContext
      login(res.user, res.token);

      // Redirect admins to admin dashboard
      if (res.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      } // redirect
    } catch (err) {
      // Check if it's a 401 (Unauthorized) error for wrong password
      if (err.response?.status === 401) {
        showAlert("The email address or password you entered is incorrect");
      } else {
        showAlert(err.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  return (
    <div className="login-page">
      <canvas className="matrix-bg" id="matrix"></canvas>

      <Link to="/" className="back-home">
        <i className="fas fa-arrow-left"></i> Back to Home
      </Link>

      <div className="login-container">
        <div className="login-card">
          <div className="login-content">
            <div className="logo">
              <h1><i className="fas fa-shield-alt"></i> CyberQuest</h1>
              <p>Welcome back, hacker!</p>
            </div>

            {alertMessage && (
              <div className="alert-custom">
                <i className="fas fa-exclamation-circle"></i> {alertMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label"><i className="fas fa-envelope"></i> Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label"><i className="fas fa-lock"></i> Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="input-group-text" onClick={() => setShowPassword(!showPassword)}>
                    <i className={`fas fa-${showPassword ? "eye-slash" : "eye"}`}></i>
                  </span>
                </div>
                <div className="forgot-password-link">
                  <Link to="/forgot-password">Forgot Password?</Link>
                </div>
              </div>

              <button type="submit" className="btn btn-login" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Logging in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i> Login
                  </>
                )}
              </button>
            </form>

            <div className="divider">
              <span>OR CONTINUE WITH</span>
            </div>

            <div className="social-login">
              <button type="button" className="btn-social" onClick={() => handleSocialLogin("google")} title="Login with Google">
                <i className="fab fa-google"></i>
              </button>
              <button type="button" className="btn-social" onClick={() => handleSocialLogin("github")} title="Login with GitHub">
                <i className="fab fa-github"></i>
              </button>
              {/* Discord login removed */}
            </div>

            <div className="text-center mt-4">
              <p style={{ color: "rgba(255,255,255,0.6)" }}>
                Don’t have an account? <Link to="/register">Create Account</Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
