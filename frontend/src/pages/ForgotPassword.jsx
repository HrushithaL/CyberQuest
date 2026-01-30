import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("error"); // error or success
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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

  // Timer for OTP resend
  useEffect(() => {
    if (timer > 0) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(interval);
    }
  }, [timer]);

  const showAlert = (msg, type = "error") => {
    setAlertMessage(msg);
    setAlertType(type);
    setTimeout(() => setAlertMessage(""), 4000);
  };

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email) {
      return showAlert("Please enter your email address");
    }

    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      
      setOtpSent(true);
      setTimer(60); // 60 second timer
      setStep(2);
      showAlert("OTP sent to your email. Check your inbox!", "success");
    } catch (error) {
      showAlert(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp) {
      return showAlert("Please enter the OTP");
    }

    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/api/auth/verify-otp`, { email, otp });
      
      setStep(3);
      showAlert("OTP verified successfully! Now set your new password.", "success");
    } catch (error) {
      showAlert(error.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      return showAlert("Please enter both passwords");
    }

    if (newPassword !== confirmPassword) {
      return showAlert("Passwords do not match");
    }

    if (newPassword.length < 6) {
      return showAlert("Password must be at least 6 characters long");
    }

    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        otp,
        newPassword
      });

      showAlert("Password reset successful! Redirecting to login...", "success");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      showAlert(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;

    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      
      setTimer(60);
      showAlert("OTP resent to your email!", "success");
    } catch (error) {
      showAlert(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <canvas className="matrix-bg" id="matrix"></canvas>

      <Link to="/login" className="back-login">
        <i className="fas fa-arrow-left"></i> Back to Login
      </Link>

      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-content">
            <div className="logo">
              <h1><i className="fas fa-shield-alt"></i> CyberQuest</h1>
              <p>Reset Your Password</p>
            </div>

            {/* Progress Indicator */}
            <div className="progress-indicator">
              <div className={`step ${step >= 1 ? "active" : ""}`}>
                <span>1</span>
                <p>Email</p>
              </div>
              <div className={`connector ${step > 1 ? "active" : ""}`}></div>
              <div className={`step ${step >= 2 ? "active" : ""}`}>
                <span>2</span>
                <p>Verify OTP</p>
              </div>
              <div className={`connector ${step > 2 ? "active" : ""}`}></div>
              <div className={`step ${step >= 3 ? "active" : ""}`}>
                <span>3</span>
                <p>New Password</p>
              </div>
            </div>

            {alertMessage && (
              <div className={`alert-custom ${alertType}`}>
                <i className={`fas fa-${alertType === "success" ? "check-circle" : "exclamation-circle"}`}></i> 
                {alertMessage}
              </div>
            )}

            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={handleSendOtp}>
                <div className="mb-3">
                  <label className="form-label"><i className="fas fa-envelope"></i> Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  <small className="form-text">
                    We'll send you a verification code to reset your password.
                  </small>
                </div>

                <button type="submit" className="btn btn-reset" disabled={isLoading || !email}>
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-arrow-right"></i> Send OTP
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <div className="mb-3">
                  <label className="form-label"><i className="fas fa-code"></i> Enter OTP</label>
                  <input
                    type="text"
                    className="form-control otp-input"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    maxLength="6"
                    disabled={isLoading}
                  />
                  <small className="form-text">
                    Enter the 6-digit code sent to your email
                  </small>
                </div>

                <button type="submit" className="btn btn-reset" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Verifying...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i> Verify OTP
                    </>
                  )}
                </button>

                <div className="resend-container">
                  {timer > 0 ? (
                    <small className="form-text">
                      Resend OTP in <span className="timer">{timer}s</span>
                    </small>
                  ) : (
                    <button
                      type="button"
                      className="btn-text"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                    >
                      <i className="fas fa-redo"></i> Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="mb-3">
                  <label className="form-label"><i className="fas fa-lock"></i> New Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <span 
                      className="input-group-text" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer" }}
                    >
                      <i className={`fas fa-${showPassword ? "eye-slash" : "eye"}`}></i>
                    </span>
                  </div>
                  <small className="form-text">
                    Password must be at least 6 characters long
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label"><i className="fas fa-lock"></i> Confirm Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <button type="submit" className="btn btn-reset" disabled={isLoading || !newPassword || !confirmPassword}>
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Resetting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i> Reset Password
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="text-center mt-4">
              <p style={{ color: "rgba(255,255,255,0.6)" }}>
                Remember your password? <Link to="/login">Back to Login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
