import { useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationCenter from "./components/NotificationCenter";
import { useAuth } from "./context/AuthContext";

// Lazy-loaded page routes for performance code-splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Properties = lazy(() => import("./pages/Properties"));
const Tenants = lazy(() => import("./pages/Tenants"));
const Payments = lazy(() => import("./pages/Payments"));
const Utilities = lazy(() => import("./pages/Utilities"));
const Reports = lazy(() => import("./pages/Reports"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Zap,
  BarChart3,
  LogOut,
  Menu,
  X,
  HelpCircle,
  Home,
} from "lucide-react";
import "./App.css";

function PageLoader() {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "14px",
        color: "#64748b",
      }}
    >
      <div
        className="spinner"
        style={{
          width: "32px",
          height: "32px",
          border: "3px solid #e2e8f0",
          borderTopColor: "#2563eb",
          borderRadius: "50%",
        }}
      />
      <span style={{ fontSize: "14px", fontWeight: "500" }}>Loading module...</span>
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-icon-wrapper">
          <HelpCircle size={48} />
        </div>
        <h2>404 - Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <button
          className="primary-action-button"
          onClick={() => navigate("/dashboard")}
        >
          <Home size={18} />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
}

function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  const currentPath = location.pathname;

  const isActive = (path) => {
    if (path === "/dashboard") {
      return currentPath === "/" || currentPath === "/dashboard";
    }
    return currentPath === path;
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Properties", path: "/properties", icon: Building2 },
    { label: "Tenants", path: "/tenants", icon: Users },
    { label: "Payments", path: "/payments", icon: CreditCard },
    { label: "Utilities", path: "/utilities", icon: Zap },
    { label: "Reports", path: "/reports", icon: BarChart3 },
  ];

  const userInitial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      {/* Shell Header & Sidebar for Authenticated Users */}
      {isAuthenticated && (
        <>
          {/* Mobile Navigation Header */}
          <header className="mobile-header">
            <div className="brand-logo-group" onClick={() => navigate("/dashboard")}>
              <div className="brand-icon-pill">
                <Building2 size={20} />
              </div>
              <div className="brand-text">
                <span className="brand-name">RentFlow</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <NotificationCenter />
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </header>

          {/* Mobile Navigation Drawer / Dropdown */}
          {mobileMenuOpen && (
            <div className="mobile-nav-drawer">
              <nav className="mobile-nav-list" aria-label="Mobile Navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <button
                      key={item.path}
                      className={`mobile-nav-item ${active ? "active" : ""}`}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                      {active && <span className="active-dot" aria-hidden="true" />}
                    </button>
                  );
                })}
              </nav>

              <div className="mobile-user-footer">
                <div className="user-profile-badge">
                  <div className="user-avatar">{userInitial}</div>
                  <div className="user-details">
                    <span className="user-name">{user?.name || "RentFlow Landlord"}</span>
                    <span className="user-email">{user?.email}</span>
                  </div>
                </div>

                <button className="logout-btn" onClick={handleLogout}>
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Desktop Sidebar */}
          <aside className="desktop-sidebar" aria-label="Sidebar Navigation">
            <div className="sidebar-brand-wrapper">
              <div className="sidebar-brand" onClick={() => navigate("/dashboard")}>
                <div className="brand-icon-pill">
                  <Building2 size={24} />
                </div>
                <div className="brand-text">
                  <span className="brand-name">RentFlow</span>
                  <span className="brand-tagline">Smart Rental & Utility</span>
                </div>
              </div>

              <NotificationCenter className="sidebar-anchored" />
            </div>

            <nav className="sidebar-nav" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    className={`sidebar-nav-item ${active ? "active" : ""}`}
                    onClick={() => navigate(item.path)}
                  >
                    <div className="nav-item-indicator" aria-hidden="true" />
                    <Icon size={20} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="sidebar-footer">
              <div className="user-profile-card">
                <div className="user-avatar">{userInitial}</div>
                <div className="user-info">
                  <span className="user-name" title={user?.name || "RentFlow Landlord"}>
                    {user?.name || "RentFlow Landlord"}
                  </span>
                  <span className="user-email" title={user?.email}>
                    {user?.email}
                  </span>
                </div>
              </div>

              <button
                className="logout-button-full"
                onClick={handleLogout}
                aria-label="Logout of RentFlow"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content Viewport */}
      <main className={`main-content ${isAuthenticated ? "authenticated" : "unauthenticated"}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties"
              element={
                <ProtectedRoute>
                  <Properties />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenants"
              element={
                <ProtectedRoute>
                  <Tenants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/utilities"
              element={
                <ProtectedRoute>
                  <Utilities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                <Login
                  onLoginSuccess={() => navigate("/dashboard")}
                  onNavigateToRegister={() => navigate("/register")}
                />
              }
            />
            <Route
              path="/register"
              element={
                <Register
                  onNavigateToLogin={() => navigate("/login")}
                />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
