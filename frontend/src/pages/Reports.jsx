import { useEffect, useState } from "react";
import api from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency } from "../utils/currency";
import {
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Building2,
  Users,
  CreditCard,
  Zap,
  Filter,
  Sparkles,
  Info,
  Calendar,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import "./Reports.css";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        {label && <p className="tooltip-label">{label}</p>}
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="tooltip-value" style={{ color: entry.color || entry.fill }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function Reports() {
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [propsRes, tenantsRes, paymentsRes, utilsRes] = await Promise.all([
        api.get("/properties/"),
        api.get("/tenants/"),
        api.get("/payments/"),
        api.get("/utilities/"),
      ]);

      setProperties(propsRes.data || []);
      setTenants(tenantsRes.data || []);
      setPayments(paymentsRes.data || []);
      setUtilities(utilsRes.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch analytics data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTenantName = (tenantId) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : `Tenant #${tenantId}`;
  };

  // Format month helper
  const formatMonthKey = (dateStr) => {
    if (!dateStr) return "";
    // If format is YYYY-MM-DD or YYYY-MM
    if (dateStr.length >= 7 && dateStr.includes("-")) {
      const parts = dateStr.split("-");
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      if (monthNum >= 1 && monthNum <= 12) {
        return `${monthNames[monthNum - 1]} ${year}`;
      }
    }
    return dateStr;
  };

  // Extract unique period options from payments and utilities
  const availablePeriodsMap = {};
  payments.forEach((p) => {
    const monthVal = p.billing_month || p.due_date;
    if (monthVal) {
      const rawKey = monthVal.substring(0, 7); // YYYY-MM
      availablePeriodsMap[rawKey] = formatMonthKey(monthVal);
    }
  });

  utilities.forEach((u) => {
    const dateVal = u.due_date || u.payment_date;
    if (dateVal) {
      const rawKey = dateVal.substring(0, 7); // YYYY-MM
      if (!availablePeriodsMap[rawKey]) {
        availablePeriodsMap[rawKey] = formatMonthKey(dateVal);
      }
    }
  });

  const periodOptions = Object.keys(availablePeriodsMap).sort().reverse().map((key) => ({
    key,
    label: availablePeriodsMap[key],
  }));

  // Filter payments & utilities by selectedPeriod
  const filteredPayments = payments.filter((p) => {
    if (selectedPeriod === "all") return true;
    const pMonth = (p.billing_month || p.due_date || "").substring(0, 7);
    return pMonth === selectedPeriod;
  });

  const filteredUtilities = utilities.filter((u) => {
    if (selectedPeriod === "all") return true;
    const uMonth = (u.due_date || u.payment_date || "").substring(0, 7);
    return uMonth === selectedPeriod;
  });

  // 1. Metric Calculations
  const paidPayments = filteredPayments.filter((p) => p.status === "Paid");
  const pendingPayments = filteredPayments.filter((p) => p.status === "Pending");
  const overduePayments = filteredPayments.filter((p) => p.status === "Overdue");

  const totalCollected = paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalOverdue = overduePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalUtilityExpenses = filteredUtilities.reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

  // 2. Chart Data - Collection Pie Chart
  const collectionPieData = [
    { name: "Rent Collected", value: totalCollected, color: "#10b981" },
    { name: "Pending Rent", value: totalPending, color: "#f59e0b" },
    { name: "Overdue Rent", value: totalOverdue, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  // 3. Chart Data - Monthly Rent Trend
  const monthlyTrendMap = {};
  filteredPayments.forEach((p) => {
    const rawMonth = (p.billing_month || p.due_date || "").substring(0, 7);
    const label = formatMonthKey(p.billing_month || p.due_date);
    if (!monthlyTrendMap[rawMonth]) {
      monthlyTrendMap[rawMonth] = { month: label, Paid: 0, Pending: 0, Overdue: 0 };
    }
    const amt = Number(p.amount) || 0;
    if (p.status === "Paid") monthlyTrendMap[rawMonth].Paid += amt;
    else if (p.status === "Pending") monthlyTrendMap[rawMonth].Pending += amt;
    else if (p.status === "Overdue") monthlyTrendMap[rawMonth].Overdue += amt;
  });

  const monthlyTrendData = Object.keys(monthlyTrendMap)
    .sort()
    .map((k) => monthlyTrendMap[k]);

  // 4. Chart Data - Utility Expenses by Type
  const utilityTypeMap = {};
  filteredUtilities.forEach((u) => {
    const type = u.utility_type || "Other";
    if (!utilityTypeMap[type]) {
      utilityTypeMap[type] = { type, amount: 0, count: 0 };
    }
    utilityTypeMap[type].amount += Number(u.amount) || 0;
    utilityTypeMap[type].count += 1;
  });

  const utilityChartData = Object.values(utilityTypeMap);

  const getUtilityTypeColor = (type) => {
    switch (type) {
      case "Electricity":
        return "#f59e0b";
      case "Water":
        return "#2563eb";
      case "Gas":
        return "#ea580c";
      case "Internet":
        return "#9333ea";
      default:
        return "#64748b";
    }
  };

  // 5. Tenant Payment Breakdown Data
  const tenantReportData = tenants.map((t) => {
    const tPayments = filteredPayments.filter((p) => p.tenant_id === t.id);
    const paid = tPayments.filter((p) => p.status === "Paid").reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const pending = tPayments.filter((p) => p.status === "Pending").reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const overdue = tPayments.filter((p) => p.status === "Overdue").reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalBilled = paid + pending + overdue;

    return {
      id: t.id,
      name: t.name,
      rentConfigured: t.rent_amount,
      paid,
      pending,
      overdue,
      totalBilled,
      paymentCount: tPayments.length,
    };
  });

  // 6. Factual Highlights
  const highlights = [];
  if (overduePayments.length > 0) {
    highlights.push({
      type: "alert",
      text: `${overduePayments.length} payment(s) currently overdue totaling ${formatCurrency(totalOverdue)}.`,
    });
  }
  if (paidPayments.length > 0) {
    highlights.push({
      type: "success",
      text: `${formatCurrency(totalCollected)} successfully collected across ${paidPayments.length} paid transaction(s).`,
    });
  }
  if (filteredUtilities.length > 0) {
    highlights.push({
      type: "info",
      text: `${filteredUtilities.length} utility bill(s) recorded totaling ${formatCurrency(totalUtilityExpenses)}.`,
    });
  }
  if (utilityChartData.length > 0) {
    const maxUtil = [...utilityChartData].sort((a, b) => b.amount - a.amount)[0];
    highlights.push({
      type: "info",
      text: `${maxUtil.type} accounts for the largest utility expense at ${formatCurrency(maxUtil.amount)}.`,
    });
  }

  const primaryProperty = properties[0];

  return (
    <div className="reports-container">
      {/* Page Header */}
      <div className="reports-header-wrapper">
        <div className="reports-title-area">
          <h1>Reports & Analytics</h1>
          <p className="reports-subtitle">
            Understand rent collection, payment performance, and utility expenses
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner" style={{ marginBottom: "24px" }}>
          <div className="error-banner-content">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Period Filter Bar */}
      <div className="reports-filter-bar">
        <div className="filter-label-group">
          <Filter size={18} />
          <span>Billing Period:</span>
        </div>

        <select
          className="period-filter-select"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          aria-label="Filter reports by billing period"
        >
          <option value="all">All Billing Periods</option>
          {periodOptions.map((period) => (
            <option key={period.key} value={period.key}>
              {period.label}
            </option>
          ))}
        </select>

        {selectedPeriod !== "all" && (
          <button
            className="clear-filters-btn"
            onClick={() => setSelectedPeriod("all")}
          >
            Show All Periods
          </button>
        )}
      </div>

      {/* Top Summary Metrics Grid */}
      <div className="reports-metrics-grid">
        <div className="report-metric-card">
          <div className="report-metric-icon collected">
            <CheckCircle size={24} />
          </div>
          <div className="report-metric-info">
            <p className="report-metric-title">Rent Collected</p>
            <h3 className="report-metric-amount">
              {loading ? "—" : formatCurrency(totalCollected)}
            </h3>
            <p className="report-metric-subtitle">
              {paidPayments.length} paid transaction(s)
            </p>
          </div>
        </div>

        <div className="report-metric-card">
          <div className="report-metric-icon pending">
            <Clock size={24} />
          </div>
          <div className="report-metric-info">
            <p className="report-metric-title">Pending Rent</p>
            <h3 className="report-metric-amount">
              {loading ? "—" : formatCurrency(totalPending)}
            </h3>
            <p className="report-metric-subtitle">
              {pendingPayments.length} pending transaction(s)
            </p>
          </div>
        </div>

        <div className="report-metric-card">
          <div className="report-metric-icon overdue">
            <AlertCircle size={24} />
          </div>
          <div className="report-metric-info">
            <p className="report-metric-title">Overdue Rent</p>
            <h3 className="report-metric-amount">
              {loading ? "—" : formatCurrency(totalOverdue)}
            </h3>
            <p className="report-metric-subtitle">
              {overduePayments.length} overdue transaction(s)
            </p>
          </div>
        </div>

        <div className="report-metric-card">
          <div className="report-metric-icon utility">
            <Receipt size={24} />
          </div>
          <div className="report-metric-info">
            <p className="report-metric-title">Utility Expenses</p>
            <h3 className="report-metric-amount">
              {loading ? "—" : formatCurrency(totalUtilityExpenses)}
            </h3>
            <p className="report-metric-subtitle">
              {filteredUtilities.length} utility bill(s)
            </p>
          </div>
        </div>
      </div>

      {/* Factual Highlights Section */}
      {highlights.length > 0 && (
        <div className="highlights-card">
          <div className="highlights-header">
            <Sparkles size={20} style={{ color: "#2563eb" }} />
            <h3>Data Observations</h3>
          </div>
          <div className="highlights-list">
            {highlights.map((h, index) => (
              <div key={index} className={`highlight-item ${h.type}`}>
                <Info size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Section */}
      {loading ? (
        <div className="reports-charts-grid">
          <div className="report-chart-card">
            <div className="skeleton-box" style={{ height: "24px", width: "40%", marginBottom: "16px" }}></div>
            <div className="skeleton-box" style={{ height: "240px", width: "100%" }}></div>
          </div>
          <div className="report-chart-card">
            <div className="skeleton-box" style={{ height: "24px", width: "40%", marginBottom: "16px" }}></div>
            <div className="skeleton-box" style={{ height: "240px", width: "100%" }}></div>
          </div>
        </div>
      ) : payments.length === 0 && utilities.length === 0 ? (
        <div className="reports-empty-card">
          <div className="empty-icon-badge">
            <BarChart3 size={32} />
          </div>
          <h3>No report data available</h3>
          <p>Record your first rent payment or utility bill to view financial analytics.</p>
        </div>
      ) : (
        <>
          <div className="reports-charts-grid">
            {/* Rent Collection Donut Chart */}
            <div className="report-chart-card">
              <div className="chart-header">
                <h3>Rent Collection Status</h3>
                <p>Breakdown of paid, pending, and overdue rent</p>
              </div>

              <div className="chart-wrapper">
                {collectionPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={collectionPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {collectionPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty-state" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                    <p>No rent data recorded for this period</p>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Rent Trend Bar Chart */}
            <div className="report-chart-card">
              <div className="chart-header">
                <h3>Monthly Rent Trend</h3>
                <p>Rent collection performance by billing period</p>
              </div>

              <div className="chart-wrapper">
                {monthlyTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        tickFormatter={(val) => `₹${val / 1000}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} />
                      <Bar dataKey="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="chart-empty-state" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                    <p>No monthly trends available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Utility Expense Analysis Chart */}
          <div className="report-chart-card" style={{ marginBottom: "28px" }}>
            <div className="chart-header">
              <h3>Utility Expense Analysis</h3>
              <p>Utility expenses grouped by service type</p>
            </div>

            <div className="chart-wrapper">
              {utilityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilityChartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="type" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" name="Utility Expense" radius={[6, 6, 0, 0]}>
                      {utilityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getUtilityTypeColor(entry.type)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-empty-state" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                  <p>No utility expenses recorded for this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Property Overview */}
          {primaryProperty && (
            <div className="reports-section-card">
              <div className="section-card-header">
                <h3>Property Financial Summary</h3>
                <p>High-level operational metrics for {primaryProperty.name}</p>
              </div>

              <div className="tenant-stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div className="stat-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span className="lbl">Property Name</span>
                  <span className="val" style={{ fontSize: "16px" }}>{primaryProperty.name}</span>
                </div>
                <div className="stat-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span className="lbl">Active Tenants</span>
                  <span className="val" style={{ fontSize: "16px" }}>{tenants.length} Tenants</span>
                </div>
                <div className="stat-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span className="lbl">Monthly Rent Configured</span>
                  <span className="val" style={{ fontSize: "16px" }}>{formatCurrency(primaryProperty.monthly_rent)}</span>
                </div>
                <div className="stat-box" style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <span className="lbl">Rent Collected</span>
                  <span className="val" style={{ fontSize: "16px", color: "#10b981" }}>{formatCurrency(totalCollected)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tenant Payment Breakdown */}
          <div className="reports-section-card">
            <div className="section-card-header">
              <h3>Tenant Payment Performance</h3>
              <p>Rent payment breakdown per tenant</p>
            </div>

            <div className="table-responsive-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Configured Rent</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Overdue</th>
                    <th>Total Billed</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantReportData.map((tr) => (
                    <tr key={tr.id}>
                      <td>
                        <strong>{tr.name}</strong>
                      </td>
                      <td>{formatCurrency(tr.rentConfigured)}</td>
                      <td style={{ color: tr.paid > 0 ? "#15803d" : "#64748b", fontWeight: tr.paid > 0 ? 600 : 400 }}>
                        {formatCurrency(tr.paid)}
                      </td>
                      <td style={{ color: tr.pending > 0 ? "#b45309" : "#64748b", fontWeight: tr.pending > 0 ? 600 : 400 }}>
                        {formatCurrency(tr.pending)}
                      </td>
                      <td style={{ color: tr.overdue > 0 ? "#b91c1c" : "#64748b", fontWeight: tr.overdue > 0 ? 600 : 400 }}>
                        {formatCurrency(tr.overdue)}
                      </td>
                      <td>
                        <strong>{formatCurrency(tr.totalBilled)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History Summary Table */}
          <div className="reports-section-card">
            <div className="section-card-header">
              <h3>Payment Transactions History</h3>
              <p>Detailed history of recorded rent payments</p>
            </div>

            <div className="table-responsive-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Payment Type</th>
                    <th>Billing Month</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment Date / Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => {
                    const tenantName = getTenantName(p.tenant_id);
                    const s = p.status.toLowerCase();
                    return (
                      <tr key={p.id}>
                        <td><strong>{tenantName}</strong></td>
                        <td>{p.payment_type}</td>
                        <td>{formatMonthKey(p.billing_month) || "N/A"}</td>
                        <td>{p.due_date}</td>
                        <td><strong>{formatCurrency(p.amount)}</strong></td>
                        <td>
                          <span className={`status-pill ${s}`}>
                            {s === "paid" && <CheckCircle size={12} />}
                            {s === "pending" && <Clock size={12} />}
                            {s === "overdue" && <AlertCircle size={12} />}
                            {p.status}
                          </span>
                        </td>
                        <td>
                          {p.payment_date ? (
                            <span>{p.payment_date} {p.payment_method ? `(${p.payment_method})` : ""}</span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Utility Bills History Table */}
          <div className="reports-section-card">
            <div className="section-card-header">
              <h3>Utility Expenses History</h3>
              <p>Detailed history of recorded utility bills</p>
            </div>

            <div className="table-responsive-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Utility Type</th>
                    <th>Tenant</th>
                    <th>Connection No</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUtilities.map((u) => {
                    const tenantName = getTenantName(u.tenant_id);
                    const s = u.status.toLowerCase();
                    return (
                      <tr key={u.id}>
                        <td><strong>{u.utility_type}</strong></td>
                        <td>{tenantName}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{u.connection_number || "N/A"}</td>
                        <td><strong>{formatCurrency(u.amount)}</strong></td>
                        <td>{u.due_date}</td>
                        <td>
                          <span className={`status-pill ${s}`}>
                            {s === "paid" && <CheckCircle size={12} />}
                            {s === "pending" && <Clock size={12} />}
                            {s === "overdue" && <AlertCircle size={12} />}
                            {u.status}
                          </span>
                        </td>
                        <td style={{ color: "#64748b", fontStyle: "italic" }}>{u.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
