import { useEffect, useState } from "react";
import axios from "axios";
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
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments, setPayments] = useState([]);
  const [utilities, setUtilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          propertiesResponse,
          tenantsResponse,
          paymentsResponse,
          utilitiesResponse,
        ] = await Promise.all([
          axios.get("http://127.0.0.1:8000/properties/"),
          axios.get("http://127.0.0.1:8000/tenants/"),
          axios.get("http://127.0.0.1:8000/payments/"),
          axios.get("http://127.0.0.1:8000/utilities/"),
        ]);

        setProperties(propertiesResponse.data);
        setTenants(tenantsResponse.data);
        setPayments(paymentsResponse.data);
        setUtilities(utilitiesResponse.data);
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Extract unique billing months for filter dropdown
  const availableMonths = Array.from(
    new Set(
      payments
        .filter((p) => p.billing_month)
        .map((p) => p.billing_month)
    )
  ).sort().reverse();

  // Filter payments by selected billing_month
  const filteredPayments = selectedMonth === "all"
    ? payments
    : payments.filter((p) => p.billing_month === selectedMonth);

  const expectedRent = filteredPayments.reduce((total, p) => total + p.amount, 0);

  const totalRentCollected = filteredPayments
    .filter((payment) => payment.status === "Paid")
    .reduce((total, payment) => total + payment.amount, 0);

  const pendingRent = filteredPayments
    .filter((payment) => payment.status === "Pending")
    .reduce((total, payment) => total + payment.amount, 0);

  const overdueRent = filteredPayments
    .filter((payment) => payment.status === "Overdue")
    .reduce((total, payment) => total + payment.amount, 0);

  // Utility Bills calculation (Unaffected by month filter)
  const totalUtilities = utilities.reduce(
    (total, bill) => total + bill.amount,
    0
  );

  const paidUtilities = utilities
    .filter((bill) => bill.status === "Paid")
    .reduce((total, bill) => total + bill.amount, 0);

  const pendingUtilities = utilities
    .filter((bill) => bill.status === "Pending")
    .reduce((total, bill) => total + bill.amount, 0);

  const overdueUtilities = utilities
    .filter((bill) => bill.status === "Overdue")
    .reduce((total, bill) => total + bill.amount, 0);

  // Status Counts & Amounts for Charts
  const rentPaidCount = filteredPayments.filter((p) => p.status === "Paid").length;
  const rentPendingCount = filteredPayments.filter((p) => p.status === "Pending").length;
  const rentOverdueCount = filteredPayments.filter((p) => p.status === "Overdue").length;

  const rentPieData = [
    { name: "Paid", count: rentPaidCount, amount: totalRentCollected, color: RENT_COLORS.Paid },
    { name: "Pending", count: rentPendingCount, amount: pendingRent, color: RENT_COLORS.Pending },
    { name: "Overdue", count: rentOverdueCount, amount: overdueRent, color: RENT_COLORS.Overdue },
  ].filter((item) => item.count > 0);

  const utilityPaidCount = utilities.filter((b) => b.status === "Paid").length;
  const utilityPendingCount = utilities.filter((b) => b.status === "Pending").length;
  const utilityOverdueCount = utilities.filter((b) => b.status === "Overdue").length;

  const utilityBarData = [
    { status: "Paid", count: utilityPaidCount, amount: paidUtilities, fill: UTILITY_COLORS.Paid },
    { status: "Pending", count: utilityPendingCount, amount: pendingUtilities, fill: UTILITY_COLORS.Pending },
    { status: "Overdue", count: utilityOverdueCount, amount: overdueUtilities, fill: UTILITY_COLORS.Overdue },
  ];

  const formatCurrency = (val) => `₹${val.toLocaleString("en-IN")}`;

  const formatMonthOptionLabel = (dateStr) => {
    const parts = dateStr.split("-");
    if (parts.length >= 2) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const dateObj = new Date(year, monthNum - 1, 1);
      return dateObj.toLocaleString("en-US", { month: "long", year: "numeric" });
    }
    return dateStr;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-title">{data.name} Rent</p>
          <p>Records: <strong>{data.count}</strong></p>
          <p>Total Amount: <strong>{formatCurrency(data.amount)}</strong></p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-title">{data.status} Utilities</p>
          <p>Bills: <strong>{data.count}</strong></p>
          <p>Amount: <strong>{formatCurrency(data.amount)}</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>RentFlow Dashboard</h1>
          <p>Smart Rental & Utility Management Analytics</p>
        </div>

        {/* Billing Month Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: 600, fontSize: "14px", color: "#374151" }}>Billing Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              background: "#ffffff",
              fontWeight: 500,
              cursor: "pointer",
            }}
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

      {/* Metric Cards Grid */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Properties</h3>
          <p className="dashboard-number">{properties.length}</p>
          <span>Total registered properties</span>
        </div>

        <div className="dashboard-card">
          <h3>Tenants</h3>
          <p className="dashboard-number">{tenants.length}</p>
          <span>Active tenants</span>
        </div>

        <div className="dashboard-card metric-success">
          <h3>Rent Collected</h3>
          <p className="dashboard-number">{formatCurrency(totalRentCollected)}</p>
          <span>
            {selectedMonth !== "all" ? formatMonthOptionLabel(selectedMonth) : "Total paid rent"}
          </span>
        </div>

        <div className="dashboard-card metric-info">
          <h3>Utility Expenses</h3>
          <p className="dashboard-number">{formatCurrency(totalUtilities)}</p>
          <span>Total utility bills recorded</span>
        </div>

        <div className="dashboard-card metric-warning">
          <h3>Pending Rent</h3>
          <p className="dashboard-number">{formatCurrency(pendingRent)}</p>
          <span>{rentPendingCount} pending payment{rentPendingCount !== 1 ? "s" : ""}</span>
        </div>

        <div className="dashboard-card metric-danger">
          <h3>Overdue Rent</h3>
          <p className="dashboard-number">{formatCurrency(overdueRent)}</p>
          <span>{rentOverdueCount} overdue payment{rentOverdueCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Analytics & Charts Section */}
      <div className="dashboard-charts-container">
        {/* Rent Payment Breakdown Chart */}
        <div className="dashboard-chart-card">
          <div className="chart-card-header">
            <h2>Rent Payment Breakdown</h2>
            <p>
              {selectedMonth !== "all"
                ? `Rent status distribution for ${formatMonthOptionLabel(selectedMonth)}`
                : "Distribution of rent payments across all months"}
            </p>
          </div>

          {loading ? (
            <div className="chart-empty-state">Loading chart data...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="chart-empty-state">
              <p>No rent payments recorded for this period.</p>
              <span>Select another month or generate monthly rent.</span>
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
                      <span style={{ color: "#374151", fontWeight: 500 }}>
                        {value} ({entry.payload.count})
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Utility Bills Status Breakdown Chart */}
        <div className="dashboard-chart-card">
          <div className="chart-card-header">
            <h2>Utility Bill Status Breakdown</h2>
            <p>Overview of paid, pending, and overdue utility bills</p>
          </div>

          {loading ? (
            <div className="chart-empty-state">Loading chart data...</div>
          ) : utilities.length === 0 ? (
            <div className="chart-empty-state">
              <p>No utility bills recorded yet.</p>
              <span>Add utility bills to view status breakdown.</span>
            </div>
          ) : (
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={utilityBarData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="status" tickLine={false} stroke="#6b7280" />
                  <YAxis allowDecimals={false} tickLine={false} stroke="#6b7280" />
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

      {/* Summary Lists Overview */}
      <div className="dashboard-section">
        <div className="dashboard-box">
          <h2>Payment Overview ({selectedMonth !== "all" ? formatMonthOptionLabel(selectedMonth) : "All Time"})</h2>

          <div className="overview-row">
            <span>Expected Total Rent</span>
            <strong>{formatCurrency(expectedRent)}</strong>
          </div>

          <div className="overview-row">
            <span>Collected Rent</span>
            <strong className="text-success">{formatCurrency(totalRentCollected)}</strong>
          </div>

          <div className="overview-row">
            <span>Pending Rent</span>
            <strong className="text-warning">{formatCurrency(pendingRent)}</strong>
          </div>

          <div className="overview-row">
            <span>Overdue Rent</span>
            <strong className="text-danger">{formatCurrency(overdueRent)}</strong>
          </div>

          <div className="overview-row">
            <span>Total Payment Records</span>
            <strong>{filteredPayments.length}</strong>
          </div>
        </div>

        <div className="dashboard-box">
          <h2>Utility Overview (All Time)</h2>

          <div className="overview-row">
            <span>Total Billed Utilities</span>
            <strong>{formatCurrency(totalUtilities)}</strong>
          </div>

          <div className="overview-row">
            <span>Paid Utility Bills</span>
            <strong className="text-success">{utilityPaidCount} ({formatCurrency(paidUtilities)})</strong>
          </div>

          <div className="overview-row">
            <span>Pending Utility Bills</span>
            <strong className="text-warning">{utilityPendingCount} ({formatCurrency(pendingUtilities)})</strong>
          </div>

          <div className="overview-row">
            <span>Overdue Utility Bills</span>
            <strong className="text-danger">{utilityOverdueCount} ({formatCurrency(overdueUtilities)})</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
