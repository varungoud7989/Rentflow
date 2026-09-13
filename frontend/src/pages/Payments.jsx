import { useEffect, useState } from "react";
import axios from "axios";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);

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
    amount: "",
    due_date: "",
    billing_month: "",
    payment_date: "",
    payment_method: "",
    reference: "",
  });

  const fetchPayments = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/payments/"
      );

      setPayments(response.data);
    } catch (error) {
      console.error("Error loading payments:", error);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/tenants/"
      );

      setTenants(response.data);
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchTenants();
  }, []);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await axios.post(
        "http://127.0.0.1:8000/payments/",
        {
          tenant_id: Number(formData.tenant_id),
          payment_type: "Rent",
          amount: Number(formData.amount),
          due_date: formData.due_date,
          billing_month: formData.billing_month || null,
          payment_date: formData.payment_date || null,
          payment_method: formData.payment_method || null,
          reference: formData.reference || null,
        }
      );

      setFormData({
        tenant_id: "",
        amount: "",
        due_date: "",
        billing_month: "",
        payment_date: "",
        payment_method: "",
        reference: "",
      });

      setShowForm(false);
      fetchPayments();

    } catch (error) {
      console.error("Error creating payment:", error);

      if (error.response) {
        alert(
          error.response.data.detail ||
          "Could not record payment."
        );
      } else {
        alert(
          "Could not connect to RentFlow backend."
        );
      }
    }
  };

  const handleGenerateSubmit = async (event) => {
    event.preventDefault();
    setGenerateResult(null);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/payments/generate-monthly",
        {
          year: Number(generateForm.year),
          month: Number(generateForm.month),
        }
      );

      setGenerateResult(response.data);
      fetchPayments();
    } catch (error) {
      console.error("Error generating monthly rent:", error);
      const msg = error.response?.data?.detail || "Failed to generate monthly rent.";
      alert(msg);
    }
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(
      (tenant) => tenant.id === tenantId
    );

    return tenant
      ? tenant.name
      : "Unknown Tenant";
  };

  const getStatusClass = (status) => {
    if (status === "Paid") {
      return "status-paid";
    }

    if (status === "Overdue") {
      return "status-overdue";
    }

    return "status-pending";
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
      return dateObj.toLocaleString("en-US", { month: "long", year: "numeric" });
    }
    return dateStr;
  };

  const availableBillingMonths = Array.from(
    new Set(
      payments
        .filter((p) => p.billing_month)
        .map((p) => p.billing_month)
    )
  ).sort().reverse();

  const markAsPaid = async (paymentId) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/payments/${paymentId}/pay`
      );

      alert("Payment marked as paid!");
      fetchPayments();
    } catch (error) {
      console.error(error);
      alert("Failed to mark payment as paid.");
    }
  };

  const deletePayment = async (paymentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `http://127.0.0.1:8000/payments/${paymentId}`
      );

      alert("Payment deleted successfully!");
      fetchPayments();
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.detail ||
        "Failed to delete payment.";

      alert(message);
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

    try {
      await axios.put(
        `http://127.0.0.1:8000/payments/${editingPayment.id}`,
        {
          tenant_id: Number(editForm.tenant_id),
          payment_type: editForm.payment_type,
          amount: Number(editForm.amount),
          due_date: editForm.due_date,
          billing_month: editForm.billing_month || null,
          payment_date: editForm.payment_date || null,
          payment_method: editForm.payment_method || null,
          reference: editForm.reference || null,
        }
      );

      alert("Payment updated successfully!");

      setEditingPayment(null);
      fetchPayments();
    } catch (error) {
      console.error(error);
      alert("Failed to update payment.");
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const query = searchQuery.toLowerCase().trim();
    const tenantName = getTenantName(payment.tenant_id).toLowerCase();

    const matchesQuery = !query || tenantName.includes(query);
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMonth = monthFilter === "all" || payment.billing_month === monthFilter;

    return matchesQuery && matchesStatus && matchesMonth;
  });

  return (
    <main className="payments-page">

      <div className="page-header">

        <div>
          <h2>Rent Payments</h2>
          <p>
            Track monthly rent payments and outstanding balances
          </p>
        </div>

        <div className="header-actions" style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => {
              setShowGenerateModal(!showGenerateModal);
              setShowForm(false);
            }}
            style={{ background: "#2563eb" }}
          >
            ⚡ Generate Monthly Rent
          </button>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setShowGenerateModal(false);
            }}
          >
            + Record Payment
          </button>
        </div>

      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search payments by tenant name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>

        <select
          className="filter-select"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="all">All Billing Months</option>
          {availableBillingMonths.map((m) => (
            <option key={m} value={m}>
              {formatMonthOptionLabel(m)}
            </option>
          ))}
        </select>

        {(searchQuery || statusFilter !== "all" || monthFilter !== "all") && (
          <button
            className="cancel-button"
            style={{ margin: 0, padding: "8px 14px", fontSize: "13px" }}
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setMonthFilter("all");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {showGenerateModal && (
        <div className="payment-form" style={{ borderColor: "#2563eb", background: "#f8fafc" }}>
          <h3>Generate Monthly Rent Payments</h3>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 15px" }}>
            Automatically create rent payments for all active tenants for a specific billing month using each tenant's rent amount and due day.
          </p>

          <form onSubmit={handleGenerateSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <div>
                <label>Billing Month</label>
                <select
                  value={generateForm.month}
                  onChange={(e) => setGenerateForm({ ...generateForm, month: e.target.value })}
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2026, m - 1, 1).toLocaleString("en-US", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Billing Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2100"
                  value={generateForm.year}
                  onChange={(e) => setGenerateForm({ ...generateForm, year: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-buttons" style={{ marginTop: "15px" }}>
              <button type="submit" style={{ background: "#2563eb" }}>
                Generate Rent Payments
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowGenerateModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>

          {generateResult && (
            <div
              style={{
                marginTop: "15px",
                padding: "12px 16px",
                borderRadius: "8px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "14px",
              }}
            >
              <strong>{generateResult.message}</strong>
              <p style={{ margin: "5px 0 0" }}>
                Created: <strong>{generateResult.generated_count}</strong> | Skipped (Already Exist): <strong>{generateResult.skipped_count}</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="payment-form">

          <h3>Record Rent Payment</h3>

          <form onSubmit={handleSubmit}>

            <label>Tenant</label>

            <select
              name="tenant_id"
              value={formData.tenant_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Select Tenant
              </option>

              {tenants.map((tenant) => (
                <option
                  key={tenant.id}
                  value={tenant.id}
                >
                  {tenant.name}
                </option>
              ))}

            </select>

            <label>Rent Amount</label>

            <input
              type="number"
              name="amount"
              placeholder="12000"
              value={formData.amount}
              onChange={handleChange}
              required
            />

            <label>Due Date</label>

            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              required
            />

            <label>Billing Month (Optional)</label>

            <input
              type="date"
              name="billing_month"
              value={formData.billing_month}
              onChange={handleChange}
              placeholder="First day of billing month (e.g. 2026-09-01)"
            />

            <label>Payment Date</label>

            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
            />

            <label>Payment Method</label>

            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
            >
              <option value="">
                Select Method
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="Cash">
                Cash
              </option>

              <option value="Bank Transfer">
                Bank Transfer
              </option>

              <option value="Other">
                Other
              </option>
            </select>

            <label>Reference</label>

            <input
              type="text"
              name="reference"
              placeholder="UPI reference / transaction ID"
              value={formData.reference}
              onChange={handleChange}
            />

            <div className="form-buttons">

              <button type="submit">
                Save Payment
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>
      )}

      {editingPayment && (
        <div className="form-card">
          <h2>Edit Payment</h2>

          <form onSubmit={updatePayment}>

            <label>Tenant</label>

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

            <label>Payment Type</label>

            <select
              name="payment_type"
              value={editForm.payment_type}
              onChange={handleEditChange}
            >
              <option value="Rent">Rent</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={editForm.amount}
              onChange={handleEditChange}
              required
            />

            <label>Due Date</label>

            <input
              type="date"
              name="due_date"
              value={editForm.due_date}
              onChange={handleEditChange}
              required
            />

            <label>Billing Month</label>

            <input
              type="date"
              name="billing_month"
              value={editForm.billing_month}
              onChange={handleEditChange}
            />

            <label>Payment Date</label>

            <input
              type="date"
              name="payment_date"
              value={editForm.payment_date}
              onChange={handleEditChange}
            />

            <label>Payment Method</label>

            <select
              name="payment_method"
              value={editForm.payment_method}
              onChange={handleEditChange}
            >
              <option value="">Select Method</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="text"
              name="reference"
              placeholder="Reference Number"
              value={editForm.reference}
              onChange={handleEditChange}
            />

            <button type="submit">
              Save Changes
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={() => setEditingPayment(null)}
            >
              Cancel
            </button>

          </form>
        </div>
      )}

      <div className="payment-list">

        {payments.length === 0 ? (

          <div className="empty-property">

            <h3>No payments yet</h3>

            <p>
              Generate or record your first rent payment.
            </p>

          </div>

        ) : filteredPayments.length === 0 ? (

          <div className="empty-property">
            <h3>No matching payments found</h3>
            <p>Try adjusting your search query, status filter, or billing month selection.</p>
          </div>

        ) : (

          filteredPayments.map((payment) => (

            <div
              className="payment-card"
              key={payment.id}
            >

              <div className="payment-main">

                <div>
                  <h3>
                    {getTenantName(
                      payment.tenant_id
                    )}
                  </h3>

                  <p>
                    {formatPaymentTitle(payment)}
                  </p>
                </div>

                <div className="payment-amount">
                  ₹{payment.amount.toLocaleString()}
                </div>

              </div>

              <div className="payment-details">

                <div>
                  <span>Due Date</span>

                  <strong>
                    {payment.due_date}
                  </strong>
                </div>

                <div>
                  <span>Payment Date</span>

                  <strong>
                    {payment.payment_date ||
                      "Not paid"}
                  </strong>
                </div>

                <div>
                  <span>Method</span>

                  <strong>
                    {payment.payment_method ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Status</span>

                  <strong
                    className={getStatusClass(
                      payment.status
                    )}
                  >
                    {payment.status}
                  </strong>
                </div>

              </div>

              {payment.status !== "Paid" && (
                <button
                  className="pay-button"
                  onClick={() => markAsPaid(payment.id)}
                >
                  Mark as Paid
                </button>
              )}

              <button
                className="edit-button"
                onClick={() => startEditing(payment)}
              >
                Edit
              </button>

              <button
                className="delete-button"
                onClick={() => deletePayment(payment.id)}
              >
                Delete
              </button>

            </div>

          ))

        )}

      </div>

    </main>
  );
}

export default Payments;
