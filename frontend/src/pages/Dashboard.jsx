import { useEffect, useState } from "react";
import api from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency } from "../utils/currency";
import { useAuth } from "../context/AuthContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Building2,
  Users,
  CreditCard,
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  Activity,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import "./Dashboard.css";

const RENT_COLORS = {
  Paid: "#16a34a",
  Pending: "#d97706",
  Overdue: "#dc2626",
};

const UTILITY_COLORS = {
  Paid: "#2563eb",
  Pending: "#f59e0b",
  Overdue: "#ef4444",
};

function Dashboard() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError("");
      try {
        const [
          propertiesResponse,
          tenantsResponse,
          paymentsResponse,
          utilitiesResponse,
        ] = await Promise.all([
          api.get("/properties/"),
          api.get("/tenants/"),
          api.get("/payments/"),
          api.get("/utilities/"),
        ]);

        setProperties(propertiesResponse.data || []);
        setTenants(tenantsResponse.data || []);
        setPayments(paymentsResponse.data || []);
        setUtilities(utilitiesResponse.data || []);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load dashboard data."));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Helper map for Tenant names
  const getTenantName = (tenantId) => {
    const t = tenants.find((item) => item.id === tenantId);
    return t ? t.name : `Tenant #${tenantId}`;
  };

  // Helper map for Property names
  const getPropertyName = (propertyId) => {
    const p = properties.find((item) => item.id === propertyId);
    return p ? p.name : `Property #${propertyId}`;
  };

  // Extract unique billing months for filter dropdown
  const availableMonths = Array.from(
    new Set(
      payments
        .filter((p) => p.billing_month)
        .map((p) => p.billing_month)
    )
  )
    .sort()
    .reverse();

  // Filter payments by selected billing_month
  const filteredPayments =
    selectedMonth === "all"
      ? payments
      : payments.filter((p) => p.billing_month === selectedMonth);

  const expectedRent = filteredPayments.reduce(
    (total, p) => total + (p.amount || 0),
    0
  );

  const totalRentCollected = filteredPayments
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + (payment.amount || 0), 0);

  const pendingRent = filteredPayments
    .filter((payment) => payment.status === "Pending")
    .reduce((total, payment) => total + (payment.amount || 0), 0);

  const overdueRent = filteredPayments
    .filter((payment) => payment.status === "Overdue")
    .reduce((total, payment) => total + (payment.amount || 0), 0);

  // Utility Bills calculation
  const totalUtilities = utilities.reduce(
    (total, bill) => total + (bill.amount || 0),
    0
  );

  const paidUtilities = utilities
    .filter((bill) => bill.status === "Paid")
    .reduce((total, bill) => total + (bill.amount || 0), 0);

  const pendingUtilities = utilities
    .filter((bill) => bill.status === "Pending")
    .reduce((total, bill) => total + (bill.amount || 0), 0);

  const overdueUtilities = utilities
    .filter((bill) => bill.status === "Overdue")
    .reduce((total, bill) => total + (bill.amount || 0), 0);

  // Counts for Badges & Charts
  const rentPaidCount = filteredPayments.filter((p) => p.status === "Paid").length;
  const rentPendingCount = filteredPayments.filter(
    (p) => p.status === "Pending"
  ).length;
  const rentOverdueCount = filteredPayments.filter(
    (p) => p.status === "Overdue"
  ).length;

  const rentPieData = [
    {
      name: "Paid",
      count: rentPaidCount,
      amount: totalRentCollected,
      color: RENT_COLORS.Paid,
    },
    {
      name: "Pending",
      count: rentPendingCount,
      amount: pendingRent,
      color: RENT_COLORS.Pending,
    },
    {
      name: "Overdue",
      count: rentOverdueCount,
      amount: overdueRent,
      color: RENT_COLORS.Overdue,
    },
  ].filter((item) => item.count > 0);

  const utilityPaidCount = utilities.filter((b) => b.status === "Paid").length;
  const utilityPendingCount = utilities.filter(
    (b) => b.status === "Pending"
  ).length;
  const utilityOverdueCount = utilities.filter(
    (b) => b.status === "Overdue"
  ).length;

  const utilityBarData = [
    {
      status: "Paid",
      count: utilityPaidCount,
      amount: paidUtilities,
      fill: UTILITY_COLORS.Paid,
    },
    {
      status: "Pending",
      count: utilityPendingCount,
      amount: pendingUtilities,
      fill: UTILITY_COLORS.Pending,
    },
    {
      status: "Overdue",
      count: utilityOverdueCount,
      amount: overdueUtilities,
      fill: UTILITY_COLORS.Overdue,
    },
  ];

  const formatMonthOptionLabel = (dateStr) => {
    if (!dateStr || dateStr === "all") return "All Months";
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const dateObj = new Date(year, monthNum - 1, 1);
      return dateObj.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    return dateStr;
  };

  const renderStatusBadge = (status) => {
    if (status === "Paid") {
      return (
        <span className="status-badge status-paid">
          <CheckCircle2 size={12} /> Paid
        </span>
      );
    }
    if (status === "Overdue") {
      return (
        <span className="status-badge status-overdue">
          <AlertTriangle size={12} /> Overdue
        </span>
      );
    }
    return (
      <span className="status-badge status-pending">
        <Clock size={12} /> Pending
      </span>
    );
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="enhanced-chart-tooltip">
          <div className="tooltip-header">{data.name} Rent</div>
          <div className="tooltip-row">
            <span>Records:</span>
            <strong>{data.count}</strong>
          </div>
          <div className="tooltip-row">
            <span>Total Amount:</span>
            <strong>{formatCurrency(data.amount)}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="enhanced-chart-tooltip">
          <div className="tooltip-header">{data.status} Utilities</div>
          <div className="tooltip-row">
            <span>Bills:</span>
            <strong>{data.count}</strong>
          </div>
          <div className="tooltip-row">
            <span>Total Amount:</span>
            <strong>{formatCurrency(data.amount)}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header-wrapper">
        <div className="dashboard-title-area">
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            <span>
              Welcome back,{" "}
              <strong>{user?.name || "RentFlow Demo Landlord"}</strong>
            </span>
            <span className="dashboard-user-badge">
              <Activity size={12} /> Active Manager
            </span>
          </p>
        </div>

        {/* Filter Controls */}
        <div className="dashboard-controls">
          <span className="filter-label">
            <Filter size={15} /> Billing Month:
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="filter-select-enhanced"
            aria-label="Filter payments by billing month"
          >
            <option value="all">All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthOptionLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="login-error-banner" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Metric Cards Section */}
      {loading ? (
        <div className="dashboard-metrics-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-box skeleton-card" />
          ))}
        </div>
      ) : (
        <div className="dashboard-metrics-grid">
          {/* Card 1: Rent Collected */}
          <div className="metric-card-enhanced theme-success">
            <div className="metric-card-header">
              <span className="metric-card-title">Rent Collected</span>
              <div className="metric-icon-bg">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="metric-card-value">
              {formatCurrency(totalRentCollected)}
            </div>
            <div className="metric-card-footer">
              <span>{rentPaidCount} paid record{rentPaidCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Card 2: Pending Rent */}
          <div className="metric-card-enhanced theme-warning">
            <div className="metric-card-header">
              <span className="metric-card-title">Pending Rent</span>
              <div className="metric-icon-bg">
                <Clock size={18} />
              </div>
            </div>
            <div className="metric-card-value">
              {formatCurrency(pendingRent)}
            </div>
            <div className="metric-card-footer">
              <span>{rentPendingCount} pending record{rentPendingCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Card 3: Overdue Rent */}
          <div className="metric-card-enhanced theme-danger">
            <div className="metric-card-header">
              <span className="metric-card-title">Overdue Rent</span>
              <div className="metric-icon-bg">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="metric-card-value">
              {formatCurrency(overdueRent)}
            </div>
            <div className="metric-card-footer">
              <span>{rentOverdueCount} overdue record{rentOverdueCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Card 4: Utility Expenses */}
          <div className="metric-card-enhanced theme-info">
            <div className="metric-card-header">
              <span className="metric-card-title">Utility Expenses</span>
              <div className="metric-icon-bg">
                <Zap size={18} />
              </div>
            </div>
            <div className="metric-card-value">
              {formatCurrency(totalUtilities)}
            </div>
            <div className="metric-card-footer">
              <span>{utilities.length} total utility bill{utilities.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Card 5: Properties */}
          <div className="metric-card-enhanced theme-indigo">
            <div className="metric-card-header">
              <span className="metric-card-title">Properties</span>
              <div className="metric-icon-bg">
                <Building2 size={18} />
              </div>
            </div>
            <div className="metric-card-value">{properties.length}</div>
            <div className="metric-card-footer">
              <span>Registered properties</span>
            </div>
          </div>

          {/* Card 6: Tenants */}
          <div className="metric-card-enhanced theme-purple">
            <div className="metric-card-header">
              <span className="metric-card-title">Tenants</span>
              <div className="metric-icon-bg">
                <Users size={18} />
              </div>
            </div>
            <div className="metric-card-value">{tenants.length}</div>
            <div className="metric-card-footer">
              <span>Active tenant profiles</span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="dashboard-charts-grid">
        {/* Rent Status Donut Chart */}
        <div className="chart-card-enhanced">
          <div className="chart-card-title-area">
            <div>
              <h2>Rent Payment Breakdown</h2>
              <p>
                {selectedMonth !== "all"
                  ? `Status distribution for ${formatMonthOptionLabel(selectedMonth)}`
                  : "Overall distribution across all billing months"}
              </p>
            </div>
            <span className="chart-badge">
              <Calendar size={13} /> {formatMonthOptionLabel(selectedMonth)}
            </span>
          </div>

          {loading ? (
            <div className="skeleton-box skeleton-chart" />
          ) : filteredPayments.length === 0 ? (
            <div className="chart-empty-state">
              <FileText size={32} style={{ color: "#94a3b8" }} />
              <p>No rent payments found</p>
              <span>Select another month or record new rent payments.</span>
            </div>
          ) : (
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={rentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {rentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => (
                      <span
                        style={{
                          color: "#334155",
                          fontWeight: 600,
                          fontSize: "13px",
                        }}
                      >
                        {value} ({entry.payload.count})
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Utility Bills Status Bar Chart */}
        <div className="chart-card-enhanced">
          <div className="chart-card-title-area">
            <div>
              <h2>Utility Status Breakdown</h2>
              <p>Overview of paid, pending, and overdue utility bills</p>
            </div>
            <span className="chart-badge">
              <Zap size={13} /> Utilities
            </span>
          </div>

          {loading ? (
            <div className="skeleton-box skeleton-chart" />
          ) : utilities.length === 0 ? (
            <div className="chart-empty-state">
              <Zap size={32} style={{ color: "#94a3b8" }} />
              <p>No utility bills recorded</p>
              <span>Add utility bills to view status breakdown.</span>
            </div>
          ) : (
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={utilityBarData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis dataKey="status" tickLine={false} stroke="#64748b" />
                  <YAxis allowDecimals={false} tickLine={false} stroke="#64748b" />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {utilityBarData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Summaries Grid */}
      <div className="dashboard-activity-grid">
        {/* Recent Rent Payments Card */}
        <div className="activity-card-enhanced">
          <div className="activity-card-header">
            <h2>Recent Rent Payments</h2>
            <span className="chart-badge">
              <CreditCard size={13} /> Total: {formatCurrency(expectedRent)}
            </span>
          </div>

          {loading ? (
            <div className="activity-list">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-box skeleton-activity-item" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="dashboard-empty-state">
              <p>No rent payments recorded for this period.</p>
            </div>
          ) : (
            <div className="activity-list">
              {filteredPayments.slice(0, 5).map((payment) => (
                <div className="activity-item" key={payment.id}>
                  <div className="activity-item-main">
                    <div className="activity-avatar-icon">👤</div>
                    <div className="activity-details">
                      <h4>{getTenantName(payment.tenant_id)}</h4>
                      <p>
                        {payment.billing_month
                          ? `Billing: ${payment.billing_month}`
                          : `Due: ${payment.due_date}`}
                      </p>
                    </div>
                  </div>
                  <div className="activity-item-right">
                    <span className="activity-amount">
                      {formatCurrency(payment.amount)}
                    </span>
                    {renderStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Utility Bills Card */}
        <div className="activity-card-enhanced">
          <div className="activity-card-header">
            <h2>Recent Utility Bills</h2>
            <span className="chart-badge">
              <Zap size={13} /> Total: {formatCurrency(totalUtilities)}
            </span>
          </div>

          {loading ? (
            <div className="activity-list">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-box skeleton-activity-item" />
              ))}
            </div>
          ) : utilities.length === 0 ? (
            <div className="dashboard-empty-state">
              <p>No utility bills recorded yet.</p>
            </div>
          ) : (
            <div className="activity-list">
              {utilities.slice(0, 5).map((bill) => (
                <div className="activity-item" key={bill.id}>
                  <div className="activity-item-main">
                    <div className="activity-avatar-icon">⚡</div>
                    <div className="activity-details">
                      <h4>
                        {bill.utility_type} Bill • {getTenantName(bill.tenant_id)}
                      </h4>
                      <p>
                        Conn: {bill.connection_number || "N/A"} • Due: {bill.due_date}
                      </p>
                    </div>
                  </div>
                  <div className="activity-item-right">
                    <span className="activity-amount">
                      {formatCurrency(bill.amount)}
                    </span>
                    {renderStatusBadge(bill.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
