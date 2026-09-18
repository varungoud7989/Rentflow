import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login({ onLoginSuccess, onNavigateToRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  const validateForm = () => {
    const errors = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Please enter a valid email address.";
      }
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setSuccessMsg("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await login(email, password);

      setSuccessMsg("Login successful! Redirecting...");

      if (onLoginSuccess) {
        setTimeout(() => {
          onLoginSuccess();
        }, 800);
      }
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🏠</div>
          <h2>RentFlow</h2>
          <p className="login-subtitle">Smart Rental & Utility Management</p>
        </div>

        {error && <div className="login-error-banner">{error}</div>}
        {successMsg && <div className="login-success-banner">{successMsg}</div>}

        <form onSubmit={handleSubmit} noValidate className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
              placeholder="name@example.com"
              disabled={loading}
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="field-error-text">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors((prev) => ({ ...prev, password: "" }));
                }
              }}
              placeholder="••••••••"
              disabled={loading}
              autoComplete="current-password"
            />
            {validationErrors.password && (
              <span className="field-error-text">{validationErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        <div className="register-link-placeholder">
          <span>Don't have an account? </span>
          <button
            type="button"
            className="register-link-btn"
            onClick={() => onNavigateToRegister && onNavigateToRegister()}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

