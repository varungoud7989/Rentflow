import { useEffect, useState } from "react";
import api from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency } from "../utils/currency";
import {
  CreditCard,
  Plus,
  Zap,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Edit3,
  Trash2,
  Check,
  User,
  Hash,
} from "lucide-react";
import "./Payments.css";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);

  const currentDate = new Date();
  const [generateForm, setGenerateForm] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [editingPayment, setEditingPayment] = useState(null);

  const [editForm, setEditForm] = useState({
    tenant_id: "",
    payment_type: "Rent",
    amount: "",
    due_date: "",
    billing_month: "",
    payment_date: "",
    payment_method: "",
    reference: "",
  });

  const [formData, setFormData] = useState({
    tenant_id: "",
    payment_type: "Rent",
    amount: "",
    due_date: "",
    billing_month: "",
    payment_date: "",
    payment_method: "",
    reference: "",
  });

  const fetchPayments = async () => {
    try {
      const response = await api.get("/payments/");
      setPayments(response.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load payments."));
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get("/tenants/");
      setTenants(response.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load tenants."));
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError("");
      await Promise.all([fetchPayments(), fetchTenants()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Smart form behavior: Auto-fill rent_amount when tenant selected
      if (name === "tenant_id" && value) {
        const selectedTenant = tenants.find((t) => t.id === Number(value));
        if (selectedTenant && selectedTenant.rent_amount && !prev.amount) {
          updated.amount = selectedTenant.rent_amount;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/payments/", {
        tenant_id: Number(formData.tenant_id),
        payment_type: formData.payment_type || "Rent",
        amount: Number(formData.amount),
        due_date: formData.due_date,
        billing_month: formData.billing_month || null,
        payment_date: formData.payment_date || null,
        payment_method: formData.payment_method || null,
        reference: formData.reference || null,
      });

      setFormData({
        tenant_id: "",
        payment_type: "Rent",
        amount: "",
        due_date: "",
        billing_month: "",
        payment_date: "",
        payment_method: "",
        reference: "",
      });

      setShowForm(false);
      fetchPayments();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not record payment."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setGenerateResult(null);

    try {
      const response = await api.post("/payments/generate-monthly", {
        year: Number(generateForm.year),
        month: Number(generateForm.month),
      });

      setGenerateResult(response.data);
      fetchPayments();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to generate monthly rent."));
    } finally {
      setSubmitting(false);
    }
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : `Tenant #${tenantId}`;
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

  const formatPaymentTitle = (payment) => {
    if (payment.billing_month) {
      const parts = payment.billing_month.split("-");
      if (parts.length >= 2) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const dateObj = new Date(year, monthNum - 1, 1);
        const monthName = dateObj.toLocaleString("en-US", { month: "long" });
        return `Rent for ${monthName} ${year}`;
      }
    }
    return `${payment.payment_type || "Rent"} Payment`;
  };

  const formatMonthOptionLabel = (dateStr) => {
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

  const availableBillingMonths = Array.from(
    new Set(
      payments
        .filter((p) => p.billing_month)
        .map((p) => p.billing_month)
    )
  )
    .sort()
    .reverse();

  const markAsPaid = async (paymentId) => {
    try {
      await api.put(`/payments/${paymentId}/pay`);
      fetchPayments();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to mark payment as paid."));
    }
  };

  const deletePayment = async (paymentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment record? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/payments/${paymentId}`);
      fetchPayments();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to delete payment."));
    }
  };

  const startEditing = (payment) => {
    setEditingPayment(payment);
    setEditForm({
      tenant_id: payment.tenant_id,
      payment_type: payment.payment_type,
      amount: payment.amount,
      due_date: payment.due_date,
      billing_month: payment.billing_month || "",
      payment_date: payment.payment_date || "",
      payment_method: payment.payment_method || "",
      reference: payment.reference || "",
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const updatePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/payments/${editingPayment.id}`, {
        tenant_id: Number(editForm.tenant_id),
        payment_type: editForm.payment_type,
        amount: Number(editForm.amount),
        due_date: editForm.due_date,
        billing_month: editForm.billing_month || null,
        payment_date: editForm.payment_date || null,
        payment_method: editForm.payment_method || null,
        reference: editForm.reference || null,
      });

      setEditingPayment(null);
      fetchPayments();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to update payment."));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const query = searchQuery.toLowerCase().trim();
    const tenantName = getTenantName(payment.tenant_id).toLowerCase();

    const matchesQuery = !query || tenantName.includes(query);
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    const matchesMonth =
      monthFilter === "all" || payment.billing_month === monthFilter;
    const matchesType =
      typeFilter === "all" || payment.payment_type === typeFilter;

    return matchesQuery && matchesStatus && matchesMonth && matchesType;
  });

  // Calculate Summary Totals from filtered list
  const totalPaidAmount = filteredPayments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingAmount = filteredPayments
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const overdueAmount = filteredPayments
    .filter((p) => p.status === "Overdue")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalExpectedAmount = filteredPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  const paidCount = filteredPayments.filter((p) => p.status === "Paid").length;
  const pendingCount = filteredPayments.filter(
    (p) => p.status === "Pending"
  ).length;
  const overdueCount = filteredPayments.filter(
    (p) => p.status === "Overdue"
  ).length;

  return (
    <div className="payments-container">
      {/* Page Header */}
      <div className="payments-header-wrapper">
        <div className="payments-title-area">
          <h1>Payments</h1>
          <p className="payments-subtitle">
            Track rent payments, due dates, and payment history
          </p>
        </div>

        <div className="header-actions-group">
          <button
            className="secondary-action-button"
            onClick={() => {
              setShowGenerateModal(!showGenerateModal);
              setShowForm(false);
              setEditingPayment(null);
            }}
          >
            <Zap size={16} /> Generate Monthly Rent
          </button>

          <button
            className="primary-add-button"
            onClick={() => {
              setShowForm(!showForm);
              setShowGenerateModal(false);
              setEditingPayment(null);
            }}
          >
            <Plus size={18} /> {showForm ? "Cancel Record" : "Record Payment"}
          </button>
        </div>
      </div>

      {error && (
        <div className="login-error-banner" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {!loading && (
        <div className="payments-metrics-grid">
          <div className="metric-card-enhanced theme-success">
            <div className="metric-card-header">
              <span className="metric-card-title">Total Paid</span>
              <div className="metric-icon-bg">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="metric-card-value">
              {formatCurrency(totalPaidAmount)}
            </div>
            <div className="metric-card-footer">
              <span>{paidCount} paid payment{paidCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="metric-card-enhanced theme-warning">
            <div className="metric-card-header">
              <span className="metric-card-title">Pending</span>
              <div className="metric-icon-bg">
                <Clock size={18} />
              </div>
            </div>
            <div className="metric-card-value">
              {formatCurrency(pendingAmount)}
            </div>
            <div className="metric-card-footer">
              <span>{pendingCount} pending payment{pendingCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="metric-card-enhanced theme-danger">
            <div className="metric-card-header">
              <span className="metric-card-title">Overdue</span>
              <div className="metric-icon-bg">
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="metric-card-value">
              {formatCurrency(overdueAmount)}
            </div>
            <div className="metric-card-footer">
              <span>{overdueCount} overdue payment{overdueCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          <div className="metric-card-enhanced theme-indigo">
            <div className="metric-card-header">
              <span className="metric-card-title">Total Expected</span>
              <div className="metric-icon-bg">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="metric-card-value">
              {formatCurrency(totalExpectedAmount)}
            </div>
            <div className="metric-card-footer">
              <span>{filteredPayments.length} total payment record{filteredPayments.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="payments-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-left" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search payments by tenant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="payments-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>

        <select
          className="payments-filter-select"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          aria-label="Filter by billing month"
        >
          <option value="all">All Billing Months</option>
          {availableBillingMonths.map((m) => (
            <option key={m} value={m}>
              {formatMonthOptionLabel(m)}
            </option>
          ))}
        </select>

        <select
          className="payments-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by payment type"
        >
          <option value="all">All Types</option>
          <option value="Rent">Rent</option>
          <option value="Other">Other</option>
        </select>

        {(searchQuery ||
          statusFilter !== "all" ||
          monthFilter !== "all" ||
          typeFilter !== "all") && (
          <button
            className="clear-search-btn"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setMonthFilter("all");
              setTypeFilter("all");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Generate Monthly Rent Modal */}
      {showGenerateModal && (
        <div className="payment-form-card-saas" style={{ borderColor: "#2563eb", background: "#f8fafc" }}>
          <div className="form-header-area">
            <Zap size={20} style={{ color: "#2563eb" }} />
            <h3>Generate Monthly Rent Payments</h3>
          </div>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 16px" }}>
            Automatically create rent payments for all active tenants for a specific billing month using each tenant's rent amount and due day.
          </p>

          <form onSubmit={handleGenerateSubmit}>
            <div className="payment-form-grid">
              <div className="form-field-group">
                <label>Billing Month *</label>
                <select
                  value={generateForm.month}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, month: e.target.value })
                  }
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2026, m - 1, 1).toLocaleString("en-US", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label>Billing Year *</label>
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={generateForm.year}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, year: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-actions-row">
              <button type="submit" className="submit-btn" disabled={submitting}>
                <Zap size={16} /> {submitting ? "Generating..." : "Generate Payments"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowGenerateModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>

          {generateResult && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "14px",
              }}
            >
              <strong>{generateResult.message}</strong>
              <p style={{ margin: "4px 0 0" }}>
                Created: <strong>{generateResult.generated_count}</strong> | Skipped (Already Exist): <strong>{generateResult.skipped_count}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Form */}
      {showForm && !editingPayment && (
        <div className="payment-form-card-saas">
          <div className="form-header-area">
            <CreditCard size={20} style={{ color: "#2563eb" }} />
            <h3>Record Rent Payment</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="payment-form-grid">
              <div className="form-field-group">
                <label>Tenant *</label>
                <select
                  name="tenant_id"
                  value={formData.tenant_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label>Payment Type *</label>
                <select
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handleChange}
                >
                  <option value="Rent">Rent</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="25000"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>

              <div className="form-field-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Billing Month (Optional)</label>
                <input
                  type="date"
                  name="billing_month"
                  value={formData.billing_month}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field-group">
                <label>Payment Date</label>
                <input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field-group">
                <label>Payment Method</label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleChange}
                >
                  <option value="">Select Method</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field-group">
                <label>Reference / Transaction ID</label>
                <input
                  type="text"
                  name="reference"
                  placeholder="UPI reference number"
                  value={formData.reference}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-actions-row">
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                <Check size={16} /> {submitting ? "Saving..." : "Save Payment"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Payment Form */}
      {editingPayment && (
        <div className="payment-form-card-saas">
          <div className="form-header-area">
            <Edit3 size={20} style={{ color: "#2563eb" }} />
            <h3>Edit Payment Record</h3>
          </div>

          <form onSubmit={updatePayment}>
            <div className="payment-form-grid">
              <div className="form-field-group">
                <label>Tenant *</label>
                <select
                  name="tenant_id"
                  value={editForm.tenant_id}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label>Payment Type *</label>
                <select
                  name="payment_type"
                  value={editForm.payment_type}
                  onChange={handleEditChange}
                >
                  <option value="Rent">Rent</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  value={editForm.amount}
                  onChange={handleEditChange}
                  required
                  min="0"
                />
              </div>

              <div className="form-field-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  name="due_date"
                  value={editForm.due_date}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Billing Month</label>
                <input
                  type="date"
                  name="billing_month"
                  value={editForm.billing_month}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-field-group">
                <label>Payment Date</label>
                <input
                  type="date"
                  name="payment_date"
                  value={editForm.payment_date}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-field-group">
                <label>Payment Method</label>
                <select
                  name="payment_method"
                  value={editForm.payment_method}
                  onChange={handleEditChange}
                >
                  <option value="">Select Method</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field-group">
                <label>Reference</label>
                <input
                  type="text"
                  name="reference"
                  placeholder="Reference Number"
                  value={editForm.reference}
                  onChange={handleEditChange}
                />
              </div>
            </div>

            <div className="form-actions-row">
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                <Check size={16} /> {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setEditingPayment(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payments List / Skeletons / Empty State */}
      {loading ? (
        <div className="payments-list-saas">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-box"
              style={{ height: "140px", borderRadius: "16px" }}
            />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="dashboard-empty-state">
          <CreditCard size={40} style={{ color: "#94a3b8" }} />
          <h3>No payments recorded yet</h3>
          <p>Generate monthly rent or click "Record Payment" to get started.</p>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="dashboard-empty-state">
          <Search size={32} style={{ color: "#94a3b8" }} />
          <h3>No payments match your filters</h3>
          <p>Try adjusting your search query, status filter, or billing month selection.</p>
        </div>
      ) : (
        <div className="payments-list-saas">
          {filteredPayments.map((payment) => (
            <div className="payment-card-saas" key={payment.id}>
              <div className="payment-card-header">
                <div className="payment-tenant-title">
                  <div className="tenant-avatar-pill">
                    <User size={20} />
                  </div>
                  <div className="payment-title-text">
                    <h3>{getTenantName(payment.tenant_id)}</h3>
                    <p>{formatPaymentTitle(payment)}</p>
                  </div>
                </div>

                <div className="payment-amount-badge">
                  {formatCurrency(payment.amount)}
                  {renderStatusBadge(payment.status)}
                </div>
              </div>

              <div className="payment-meta-grid">
                <div className="meta-item">
                  <span className="label">Due Date</span>
                  <span className="value">{payment.due_date}</span>
                </div>

                <div className="meta-item">
                  <span className="label">Payment Date</span>
                  <span className="value">
                    {payment.payment_date || "Not paid"}
                  </span>
                </div>

                <div className="meta-item">
                  <span className="label">Payment Method</span>
                  <span className="value">
                    {payment.payment_method || "—"}
                  </span>
                </div>

                <div className="meta-item">
                  <span className="label">Reference / Ref</span>
                  <span className="value">{payment.reference || "—"}</span>
                </div>
              </div>

              <div className="payment-card-footer-actions">
                {payment.status !== "Paid" && (
                  <button
                    className="mark-paid-btn"
                    onClick={() => markAsPaid(payment.id)}
                  >
                    <CheckCircle2 size={14} /> Mark as Paid
                  </button>
                )}

                <button
                  className="action-edit-btn"
                  onClick={() => startEditing(payment)}
                >
                  <Edit3 size={14} /> Edit
                </button>

                <button
                  className="action-delete-btn"
                  onClick={() => deletePayment(payment.id)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Payments;
