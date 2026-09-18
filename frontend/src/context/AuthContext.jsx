import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("rentflow_access_token");
      const storedUserStr = localStorage.getItem("rentflow_user");

      if (storedToken && storedUserStr) {
        const parsedUser = JSON.parse(storedUserStr);
        if (parsedUser && typeof parsedUser === "object") {
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("rentflow_access_token");
          localStorage.removeItem("rentflow_user");
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        if (storedToken || storedUserStr) {
          localStorage.removeItem("rentflow_access_token");
          localStorage.removeItem("rentflow_user");
        }
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      localStorage.removeItem("rentflow_access_token");
      localStorage.removeItem("rentflow_user");
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = "Login failed. Please try again.";
        if (response.status === 401) {
          errorMsg = data.detail || "Invalid email or password.";
        } else if (response.status === 422 || response.status === 400) {
          errorMsg = data.detail || "Validation error occurred. Please check your credentials.";
        } else if (data.detail) {
          errorMsg = data.detail;
        }
        const err = new Error(errorMsg);
        err.status = response.status;
        throw err;
      }

      if (data.access_token && data.user) {
        localStorage.setItem("rentflow_access_token", data.access_token);
        localStorage.setItem("rentflow_user", JSON.stringify(data.user));

        setToken(data.access_token);
        setUser(data.user);
        setIsAuthenticated(true);

        return { success: true, user: data.user };
      } else {
        throw new Error("Invalid response format from server.");
      }
    } catch (err) {
      if (err.status) throw err;
      if (err.message && err.message !== "Failed to fetch" && err.message !== "Invalid response format from server.") {
        throw err;
      }
      throw new Error("Unable to connect to the backend server. Please ensure the backend is running.");
    }
  };

  const logout = () => {
    localStorage.removeItem("rentflow_access_token");
    localStorage.removeItem("rentflow_user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
