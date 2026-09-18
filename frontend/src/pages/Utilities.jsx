import { useEffect, useState } from "react";
import api from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency } from "../utils/currency";
import {
  Plus,
  Zap,
  Droplets,
  Flame,
  Globe,
  Receipt,
  Search,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  Check,
  FileText,
  Calendar,
  User,
  Hash,
  AlertTriangle,
} from "lucide-react";
import "./Utilities.css";

function Utilities() {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [deletingBill, setDeletingBill] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [addForm, setAddForm] = useState({
    tenant_id: "",
    utility_type: "Electricity",
    connection_number: "",
    amount: "",
    due_date: new Date().toISOString().split("T")[0],
    payment_date: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    tenant_id: "",
    utility_type: "Electricity",
    connection_number: "",
    amount: "",
    due_date: "",
    payment_date: "",
    notes: "",
  });

  const fetchBills = async () => {
    try {
      const response = await api.get("/utilities/");
      setBills(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch utility bills."));
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get("/tenants/");
      setTenants(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch tenants."));
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError("");
      await Promise.all([fetchBills(), fetchTenants()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const getTenantName = (tenantId) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : `Tenant #${tenantId}`;
  };

  const getUtilityIcon = (type) => {
    switch (type) {
      case "Electricity":
        return <Zap size={20} className="utility-icon" />;
      case "Water":
        return <Droplets size={20} className="utility-icon" />;
      case "Gas":
        return <Flame size={20} className="utility-icon" />;
      case "Internet":
        return <Globe size={20} className="utility-icon" />;
      default:
        return <Receipt size={20} className="utility-icon" />;
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") {
      return (
        <span className="status-pill paid">
          <CheckCircle size={14} /> Paid
        </span>
      );
    }
    if (s === "overdue") {
      return (
        <span className="status-pill overdue">
          <AlertCircle size={14} /> Overdue
        </span>
      );
    }
    return (
      <span className="status-pill pending">
        <Clock size={14} /> Pending
      </span>
    );
  };

  // Metric summaries
  const totalPaid = bills
    .filter((b) => b.status === "Paid")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const totalPending = bills
    .filter((b) => b.status === "Pending")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const totalOverdue = bills
    .filter((b) => b.status === "Overdue")
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const totalCount = bills.length;

  // Filter bills
  const filteredBills = bills.filter((bill) => {
    const query = searchQuery.toLowerCase().trim();
    const tenantName = getTenantName(bill.tenant_id).toLowerCase();
    const connNum = (bill.connection_number || "").toLowerCase();

    const matchesQuery = !query || tenantName.includes(query) || connNum.includes(query);
    const matchesType = typeFilter === "all" || bill.utility_type === typeFilter;
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;

    return matchesQuery && matchesType && matchesStatus;
  });

  const isFilterActive =
    searchQuery.trim() !== "" || typeFilter !== "all" || statusFilter !== "all";

  // Handlers for Add Form
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.post("/utilities/", {
        tenant_id: Number(addForm.tenant_id),
        utility_type: addForm.utility_type,
        connection_number: addForm.connection_number || null,
        amount: Number(addForm.amount),
        due_date: addForm.due_date,
        payment_date: addForm.payment_date || null,
        notes: addForm.notes || null,
      });

      setIsAddModalOpen(false);
      setAddForm({
        tenant_id: tenants.length > 0 ? tenants[0].id : "",
        utility_type: "Electricity",
        connection_number: "",
        amount: "",
        due_date: new Date().toISOString().split("T")[0],
        payment_date: "",
        notes: "",
      });

      await fetchBills();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add utility bill."));
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers for Edit Form
  const startEditing = (bill) => {
    setEditingBill(bill);
    setEditForm({
      tenant_id: bill.tenant_id,
      utility_type: bill.utility_type,
      connection_number: bill.connection_number || "",
      amount: bill.amount,
      due_date: bill.due_date,
      payment_date: bill.payment_date || "",
      notes: bill.notes || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await api.put(`/utilities/${editingBill.id}`, {
        tenant_id: Number(editForm.tenant_id),
        utility_type: editForm.utility_type,
        connection_number: editForm.connection_number || null,
        amount: Number(editForm.amount),
        due_date: editForm.due_date,
        payment_date: editForm.payment_date || null,
        notes: editForm.notes || null,
      });

      setEditingBill(null);
      await fetchBills();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update utility bill."));
    } finally {
      setSubmitting(false);
    }
  };

  // Mark as Paid handler
  const markAsPaid = async (billId) => {
    setError("");
    try {
      await api.put(`/utilities/${billId}/pay`);
      await fetchBills();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to mark utility bill as paid."));
    }
  };

  // Delete handlers
  const confirmDelete = async () => {
    if (!deletingBill) return;
    setSubmitting(true);
    setError("");

    try {
      await api.delete(`/utilities/${deletingBill.id}`);
      setDeletingBill(null);
      await fetchBills();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete utility bill."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="utilities-container">
      {/* Page Header */}
      <div className="utilities-header-wrapper">
        <div className="utilities-title-area">
          <h1>Utilities</h1>
          <p className="utilities-subtitle">
            Track electricity, water, and other utility bills
          </p>
        </div>

        <button
          className="primary-action-button"
          onClick={() => {
            setAddForm((prev) => ({
              ...prev,
              tenant_id: prev.tenant_id || (tenants.length > 0 ? tenants[0].id : ""),
            }));
            setIsAddModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>Add Utility Bill</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <div className="error-banner-content">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            className="dismiss-error-btn"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="utilities-metrics-grid">
        <div className="utility-metric-card">
          <div className="metric-icon-badge paid">
            <CheckCircle size={24} />
          </div>
          <div className="metric-info">
            <p className="metric-title">Total Paid</p>
            <h3 className="metric-value">{loading ? "—" : formatCurrency(totalPaid)}</h3>
          </div>
        </div>

        <div className="utility-metric-card">
          <div className="metric-icon-badge pending">
            <Clock size={24} />
          </div>
          <div className="metric-info">
            <p className="metric-title">Total Pending</p>
            <h3 className="metric-value">{loading ? "—" : formatCurrency(totalPending)}</h3>
          </div>
        </div>

        <div className="utility-metric-card">
          <div className="metric-icon-badge overdue">
            <AlertCircle size={24} />
          </div>
          <div className="metric-info">
            <p className="metric-title">Total Overdue</p>
            <h3 className="metric-value">{loading ? "—" : formatCurrency(totalOverdue)}</h3>
          </div>
        </div>

        <div className="utility-metric-card">
          <div className="metric-icon-badge total">
            <Receipt size={24} />
          </div>
          <div className="metric-info">
            <p className="metric-title">Total Utility Bills</p>
            <h3 className="metric-value">{loading ? "—" : totalCount}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="utilities-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by tenant name or connection number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by utility type"
        >
          <option value="all">All Utility Types</option>
          <option value="Electricity">Electricity</option>
          <option value="Water">Water</option>
          <option value="Gas">Gas</option>
          <option value="Internet">Internet</option>
          <option value="Other">Other</option>
        </select>

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by payment status"
        >
          <option value="all">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>

        {isFilterActive && (
          <button
            className="clear-filters-btn"
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
          >
            <X size={14} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="utilities-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card">
              <div className="skeleton-box" style={{ height: "24px", width: "50%" }}></div>
              <div className="skeleton-box" style={{ height: "16px", width: "70%" }}></div>
              <div className="skeleton-box" style={{ height: "48px", width: "100%" }}></div>
              <div className="skeleton-box" style={{ height: "32px", width: "40%" }}></div>
            </div>
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-badge">
            <Receipt size={32} />
          </div>
          <h3>No utility bills recorded yet</h3>
          <p>Add your first utility bill to track electricity, water, and other services.</p>
          <button
            className="primary-action-button"
            onClick={() => {
              setAddForm((prev) => ({
                ...prev,
                tenant_id: prev.tenant_id || (tenants.length > 0 ? tenants[0].id : ""),
              }));
              setIsAddModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Utility Bill</span>
          </button>
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon-badge">
            <Search size={32} />
          </div>
          <h3>No utility bills match your filters</h3>
          <p>Try adjusting your search query, utility type, or status filter.</p>
          <button
            className="clear-filters-btn"
            style={{ padding: "10px 20px", fontSize: "14px" }}
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
          >
            <X size={16} />
            <span>Clear Filters</span>
          </button>
        </div>
      ) : (
        <div className="utilities-grid">
          {filteredBills.map((bill) => {
            const tenantName = getTenantName(bill.tenant_id);
            const lowerType = (bill.utility_type || "other").toLowerCase();

            return (
              <div className="utility-card" key={bill.id}>
                <div>
                  <div className="utility-card-header">
                    <div className="type-badge-container">
                      <div className={`utility-type-icon-wrapper ${lowerType}`}>
                        {getUtilityIcon(bill.utility_type)}
                      </div>
                      <div className="utility-card-title">
                        <h3>{bill.utility_type}</h3>
                        {bill.connection_number && (
                          <p className="connection-number-text">
                            #{bill.connection_number}
                          </p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(bill.status)}
                  </div>

                  <div className="utility-card-body">
                    <div className="tenant-row">
                      <User size={16} style={{ color: "#64748b" }} />
                      <span>{tenantName}</span>
                    </div>

                    <div className="utility-amount-row">
                      <span className="utility-amount-label">Bill Amount</span>
                      <span className="utility-amount-value">
                        {formatCurrency(bill.amount)}
                      </span>
                    </div>

                    <div className="utility-dates-grid">
                      <div className="date-item">
                        <span className="label">Due Date</span>
                        <span className="value">
                          <Calendar size={13} style={{ color: "#64748b" }} />
                          {bill.due_date}
                        </span>
                      </div>
                      {bill.payment_date && (
                        <div className="date-item">
                          <span className="label">Paid Date</span>
                          <span className="value">
                            <Check size={13} style={{ color: "#16a34a" }} />
                            {bill.payment_date}
                          </span>
                        </div>
                      )}
                    </div>

                    {bill.notes && (
                      <div className="utility-notes">
                        <FileText size={14} style={{ flexShrink: 0, marginTop: "1px" }} />
                        <span>{bill.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="utility-card-actions">
                  {bill.status !== "Paid" && (
                    <button
                      className="mark-paid-btn"
                      onClick={() => markAsPaid(bill.id)}
                      title="Mark as Paid"
                    >
                      <Check size={14} />
                      <span>Mark Paid</span>
                    </button>
                  )}

                  <button
                    className="action-icon-btn"
                    onClick={() => startEditing(bill)}
                    title="Edit Utility Bill"
                    aria-label={`Edit ${bill.utility_type} bill for ${tenantName}`}
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    className="action-icon-btn delete"
                    onClick={() => setDeletingBill(bill)}
                    title="Delete Utility Bill"
                    aria-label={`Delete ${bill.utility_type} bill for ${tenantName}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Utility Bill Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Utility Bill</h2>
              <button
                className="close-modal-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="add-tenant">
                    Select Tenant <span className="required-star">*</span>
                  </label>
                  <select
                    id="add-tenant"
                    name="tenant_id"
                    className="form-control"
                    value={addForm.tenant_id}
                    onChange={handleAddChange}
                    required
                  >
                    <option value="">Choose Tenant</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="add-utility-type">
                    Utility Type <span className="required-star">*</span>
                  </label>
                  <select
                    id="add-utility-type"
                    name="utility_type"
                    className="form-control"
                    value={addForm.utility_type}
                    onChange={handleAddChange}
                    required
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Gas">Gas</option>
                    <option value="Internet">Internet</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="add-connection">Connection Number</label>
                  <input
                    id="add-connection"
                    type="text"
                    name="connection_number"
                    className="form-control"
                    placeholder="e.g. ELEC-BLR-001"
                    value={addForm.connection_number}
                    onChange={handleAddChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="add-amount">
                    Amount (₹) <span className="required-star">*</span>
                  </label>
                  <input
                    id="add-amount"
                    type="number"
                    name="amount"
                    className="form-control"
                    placeholder="e.g. 1850"
                    step="0.01"
                    min="0"
                    value={addForm.amount}
                    onChange={handleAddChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="add-due-date">
                    Due Date <span className="required-star">*</span>
                  </label>
                  <input
                    id="add-due-date"
                    type="date"
                    name="due_date"
                    className="form-control"
                    value={addForm.due_date}
                    onChange={handleAddChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="add-payment-date">
                    Payment Date (leave empty if pending/overdue)
                  </label>
                  <input
                    id="add-payment-date"
                    type="date"
                    name="payment_date"
                    className="form-control"
                    value={addForm.payment_date}
                    onChange={handleAddChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="add-notes">Notes</label>
                  <textarea
                    id="add-notes"
                    name="notes"
                    className="form-control"
                    placeholder="Optional details or reference info..."
                    value={addForm.notes}
                    onChange={handleAddChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-modal-btn"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-modal-btn"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Utility Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Utility Bill Modal */}
      {editingBill && (
        <div className="modal-overlay" onClick={() => setEditingBill(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Utility Bill</h2>
              <button
                className="close-modal-btn"
                onClick={() => setEditingBill(null)}
                aria-label="Close edit modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="edit-tenant">
                    Select Tenant <span className="required-star">*</span>
                  </label>
                  <select
                    id="edit-tenant"
                    name="tenant_id"
                    className="form-control"
                    value={editForm.tenant_id}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="">Choose Tenant</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-utility-type">
                    Utility Type <span className="required-star">*</span>
                  </label>
                  <select
                    id="edit-utility-type"
                    name="utility_type"
                    className="form-control"
                    value={editForm.utility_type}
                    onChange={handleEditChange}
                    required
                  >
                    <option value="Electricity">Electricity</option>
                    <option value="Water">Water</option>
                    <option value="Gas">Gas</option>
                    <option value="Internet">Internet</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="edit-connection">Connection Number</label>
                  <input
                    id="edit-connection"
                    type="text"
                    name="connection_number"
                    className="form-control"
                    placeholder="e.g. ELEC-BLR-001"
                    value={editForm.connection_number}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-amount">
                    Amount (₹) <span className="required-star">*</span>
                  </label>
                  <input
                    id="edit-amount"
                    type="number"
                    name="amount"
                    className="form-control"
                    placeholder="e.g. 1850"
                    step="0.01"
                    min="0"
                    value={editForm.amount}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-due-date">
                    Due Date <span className="required-star">*</span>
                  </label>
                  <input
                    id="edit-due-date"
                    type="date"
                    name="due_date"
                    className="form-control"
                    value={editForm.due_date}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="edit-payment-date">
                    Payment Date (leave empty if pending/overdue)
                  </label>
                  <input
                    id="edit-payment-date"
                    type="date"
                    name="payment_date"
                    className="form-control"
                    value={editForm.payment_date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="edit-notes">Notes</label>
                  <textarea
                    id="edit-notes"
                    name="notes"
                    className="form-control"
                    placeholder="Optional details or reference info..."
                    value={editForm.notes}
                    onChange={handleEditChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-modal-btn"
                  onClick={() => setEditingBill(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-modal-btn"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBill && (
        <div className="modal-overlay" onClick={() => setDeletingBill(null)}>
          <div
            className="modal-content delete-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Deletion</h2>
              <button
                className="close-modal-btn"
                onClick={() => setDeletingBill(null)}
                aria-label="Close delete modal"
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: "#475569", margin: "0 0 12px", fontSize: "14px" }}>
              Are you sure you want to delete this utility bill record? This action cannot be undone.
            </p>

            <div className="delete-info-box">
              <div className="delete-info-row">
                <span className="label">Utility Type:</span>
                <span className="val">{deletingBill.utility_type}</span>
              </div>
              <div className="delete-info-row">
                <span className="label">Tenant:</span>
                <span className="val">{getTenantName(deletingBill.tenant_id)}</span>
              </div>
              <div className="delete-info-row">
                <span className="label">Amount:</span>
                <span className="val">{formatCurrency(deletingBill.amount)}</span>
              </div>
              {deletingBill.connection_number && (
                <div className="delete-info-row">
                  <span className="label">Connection No:</span>
                  <span className="val">{deletingBill.connection_number}</span>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-modal-btn"
                onClick={() => setDeletingBill(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={confirmDelete}
                disabled={submitting}
              >
                <Trash2 size={16} />
                <span>{submitting ? "Deleting..." : "Delete Utility Bill"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Utilities;
