import { useState } from "react";

export default function Register({ onNavigateToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.name = "Full Name is required.";
    }

    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        errors.email = "Please enter a valid email address.";
      }
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.trim().length === 0) {
      errors.password = "Password cannot consist only of whitespace.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match.";
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
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.detail === "Email is already registered") {
          setError("This email address is already registered. Please try logging in instead.");
        } else if (response.status === 422 || response.status === 400) {
          setError(data.detail || "Validation error occurred. Please check your registration details.");
        } else {
          setError(data.detail || "Registration failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Success: Do NOT store JWT or automatically log in
      setSuccessMsg("Registration successful. Please login.");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Unable to connect to the backend server. Please ensure the backend is running.");
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
        {successMsg && (
          <div className="login-success-banner">
            <p style={{ margin: "0 0 10px 0" }}>{successMsg}</p>
            <button
              type="button"
              className="login-submit-button"
              onClick={() => onNavigateToLogin && onNavigateToLogin()}
            >
              Go to Login
            </button>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleSubmit} noValidate className="login-form">
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) {
                    setValidationErrors((prev) => ({ ...prev, name: "" }));
                  }
                }}
                placeholder="John Doe"
                disabled={loading}
                autoComplete="name"
              />
              {validationErrors.name && (
                <span className="field-error-text">{validationErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
                placeholder="Minimum 8 characters"
                disabled={loading}
                autoComplete="new-password"
              />
              {validationErrors.password && (
                <span className="field-error-text">{validationErrors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm-password">Confirm Password</label>
              <input
                id="reg-confirm-password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
                placeholder="Re-enter your password"
                disabled={loading}
                autoComplete="new-password"
              />
              {validationErrors.confirmPassword && (
                <span className="field-error-text">{validationErrors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register Account"}
            </button>
          </form>
        )}

        <div className="register-link-placeholder">
          <span>Already have an account? </span>
          <button
            type="button"
            className="register-link-btn"
            onClick={() => onNavigateToLogin && onNavigateToLogin()}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
