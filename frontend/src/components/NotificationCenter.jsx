import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { formatCurrency } from "../utils/currency";
import {
  Bell,
  AlertCircle,
  Clock,
  Info,
  CheckCircle,
  Check,
  Calendar,
  X,
} from "lucide-react";
import "./NotificationCenter.css";

const STORAGE_KEY = "rentflow_notification_state";

export default function NotificationCenter({ className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  });

  const navigate = useNavigate();
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  // Fetch API data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsRes, utilitiesRes, tenantsRes] = await Promise.all([
          api.get("/payments/"),
          api.get("/utilities/"),
          api.get("/tenants/"),
        ]);
        setPayments(paymentsRes.data || []);
        setUtilities(utilitiesRes.data || []);
        setTenants(tenantsRes.data || []);
      } catch (err) {
        // Silently fail to empty arrays on API error
      }
    };
    fetchData();
  }, []);

  // Handle outside click & Esc key to close popover
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const getTenantName = (tenantId) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : `Tenant #${tenantId}`;
  };

  const calculateDiffDays = (dueDateStr) => {
    if (!dueDateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDateStr);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (err) {
      return null;
    }
  };

  // Derive notifications list deterministically
  const notifications = [];

  // 1. Process Rent Payments
  payments.forEach((p) => {
    const tenantName = getTenantName(p.tenant_id);
    const formattedAmount = formatCurrency(p.amount);
    const diffDays = calculateDiffDays(p.due_date);

    if (p.status === "Overdue") {
      notifications.push({
        id: `payment-overdue-${p.id}`,
        type: "payment",
        title: "Rent overdue",
        message: `${tenantName} has an overdue rent payment of ${formattedAmount} (Due: ${p.due_date}).`,
        severity: "high",
        severityWeight: 3,
        relatedPath: "/payments",
        recordId: p.id,
        date: p.due_date,
      });
    } else if (p.status === "Pending") {
      if (diffDays !== null && diffDays >= 0 && diffDays <= 3) {
        notifications.push({
          id: `payment-duesoon-${p.id}`,
          type: "payment",
          title: "Rent due soon",
          message: `${tenantName}'s rent payment of ${formattedAmount} is due in ${
            diffDays === 0 ? "today" : diffDays + " day(s)"
          } (${p.due_date}).`,
          severity: "medium",
          severityWeight: 2,
          relatedPath: "/payments",
          recordId: p.id,
          date: p.due_date,
        });
      } else {
        notifications.push({
          id: `payment-pending-${p.id}`,
          type: "payment",
          title: "Rent payment pending",
          message: `${tenantName} has a pending rent payment of ${formattedAmount} (Due: ${p.due_date}).`,
          severity: "normal",
          severityWeight: 1,
          relatedPath: "/payments",
          recordId: p.id,
          date: p.due_date,
        });
      }
    }
  });

  // 2. Process Utility Bills
  utilities.forEach((u) => {
    const tenantName = getTenantName(u.tenant_id);
    const formattedAmount = formatCurrency(u.amount);
    const diffDays = calculateDiffDays(u.due_date);

    if (u.status === "Overdue") {
      notifications.push({
        id: `utility-overdue-${u.id}`,
        type: "utility",
        title: "Utility bill overdue",
        message: `${u.utility_type} bill for ${tenantName} of ${formattedAmount} is overdue (Due: ${u.due_date}).`,
        severity: "high",
        severityWeight: 3,
        relatedPath: "/utilities",
        recordId: u.id,
        date: u.due_date,
      });
    } else if (u.status === "Pending") {
      if (diffDays !== null && diffDays >= 0 && diffDays <= 3) {
        notifications.push({
          id: `utility-duesoon-${u.id}`,
          type: "utility",
          title: "Utility bill due soon",
          message: `${u.utility_type} bill for ${tenantName} of ${formattedAmount} is due in ${
            diffDays === 0 ? "today" : diffDays + " day(s)"
          } (${u.due_date}).`,
          severity: "medium",
          severityWeight: 2,
          relatedPath: "/utilities",
          recordId: u.id,
          date: u.due_date,
        });
      } else {
        notifications.push({
          id: `utility-pending-${u.id}`,
          type: "utility",
          title: "Utility bill pending",
          message: `${u.utility_type} bill for ${tenantName} of ${formattedAmount} is pending (Due: ${u.due_date}).`,
          severity: "normal",
          severityWeight: 1,
          relatedPath: "/utilities",
          recordId: u.id,
          date: u.due_date,
        });
      }
    }
  });

  // Sort notifications: High severity first, then Medium, then Normal
  notifications.sort((a, b) => b.severityWeight - a.severityWeight);

  // Unread calculation
  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAsRead = (id, e) => {
    if (e) e.stopPropagation();
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    } catch (err) {}
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    navigate(notification.relatedPath);
  };

  const getSeverityIcon = (severity) => {
    if (severity === "high") {
      return <AlertCircle size={18} />;
    }
    if (severity === "medium") {
      return <Clock size={18} />;
    }
    return <Info size={18} />;
  };

  return (
    <div className={`notification-center-wrapper ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className={`notification-bell-btn ${isOpen ? "active-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-popover" ref={popoverRef} role="dialog" aria-label="Notifications panel">
          <div className="popover-header">
            <div className="popover-header-title">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="unread-pill">{unreadCount} unread</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="empty-icon-circle">
                  <CheckCircle size={26} />
                </div>
                <h4>You're all caught up</h4>
                <p>No pending or overdue payment reminders at this time.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !readIds.includes(n.id);

                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`notification-item ${isUnread ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={`severity-icon-badge ${n.severity}`}>
                      {getSeverityIcon(n.severity)}
                    </div>

                    <div className="notification-content">
                      <div className="notification-title-row">
                        <span className="notification-item-title">{n.title}</span>
                        {isUnread && <span className="notification-unread-dot" title="Unread" />}
                      </div>

                      <p className="notification-item-message">{n.message}</p>

                      {n.date && (
                        <span className="notification-item-date">
                          <Calendar size={11} /> Due: {n.date}
                        </span>
                      )}
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        className="mark-single-read-btn"
                        onClick={(e) => markAsRead(n.id, e)}
                        title="Mark as read"
                        aria-label="Mark notification as read"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
