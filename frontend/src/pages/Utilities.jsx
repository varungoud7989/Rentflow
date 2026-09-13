import { useEffect, useState } from "react";
import axios from "axios";

function Utilities() {
  const [bills, setBills] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    tenant_id: "",
    utility_type: "Electricity",
    connection_number: "",
    amount: "",
    due_date: "",
    payment_date: "",
    notes: "",
  });

  const [editingBill, setEditingBill] = useState(null);

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
      const response = await axios.get("http://127.0.0.1:8000/utilities/");
      setBills(response.data);
    } catch (error) {
      console.error("Error fetching utility bills:", error);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/tenants/");
      setTenants(response.data);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchTenants();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://127.0.0.1:8000/utilities/", {
        tenant_id: Number(form.tenant_id),
        utility_type: form.utility_type,
        connection_number: form.connection_number,
        amount: Number(form.amount),
        due_date: form.due_date,
        payment_date: form.payment_date || null,
        notes: form.notes,
      });

      alert("Utility bill added successfully!");

      setForm({
        tenant_id: "",
        utility_type: "Electricity",
        connection_number: "",
        amount: "",
        due_date: "",
        payment_date: "",
        notes: "",
      });

      fetchBills();
    } catch (error) {
      console.error(error);
      alert("Failed to add utility bill.");
    }
  };

  const markAsPaid = async (billId) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/utilities/${billId}/pay`
      );

      alert("Utility bill marked as paid!");
      fetchBills();
    } catch (error) {
      console.error(error);
      alert("Failed to mark utility bill as paid.");
    }
  };

  const deleteBill = async (billId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this utility bill?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `http://127.0.0.1:8000/utilities/${billId}`
      );

      alert("Utility bill deleted successfully!");

      fetchBills();
    } catch (error) {
      console.error(error);
      alert("Failed to delete utility bill.");
    }
  };

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
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const updateBill = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://127.0.0.1:8000/utilities/${editingBill.id}`,
        {
          tenant_id: Number(editForm.tenant_id),
          utility_type: editForm.utility_type,
          connection_number: editForm.connection_number || null,
          amount: Number(editForm.amount),
          due_date: editForm.due_date,
          payment_date: editForm.payment_date || null,
          notes: editForm.notes || null,
        }
      );

      alert("Utility bill updated successfully!");

      setEditingBill(null);
      fetchBills();
    } catch (error) {
      console.error(error);
      alert("Failed to update utility bill.");
    }
  };

  const getTenantName = (tenantId) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    return tenant ? tenant.name : `Tenant #${tenantId}`;
  };

  const filteredBills = bills.filter((bill) => {
    const query = searchQuery.toLowerCase().trim();
    const tenantName = getTenantName(bill.tenant_id).toLowerCase();

    const matchesQuery = !query || tenantName.includes(query);
    const matchesType = typeFilter === "all" || bill.utility_type === typeFilter;
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;

    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div className="page" style={{ maxWidth: "1200px", margin: "auto", padding: "35px" }}>
      <h1>Utility Bills</h1>
      <p className="page-subtitle" style={{ color: "#6b7280", margin: "0 0 25px" }}>
        Track electricity, water and other utility bills.
      </p>

      {/* Search & Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search utility bills by tenant name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
        >
          <option value="all">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>

        {(searchQuery || typeFilter !== "all" || statusFilter !== "all") && (
          <button
            className="cancel-button"
            style={{ margin: 0, padding: "8px 14px", fontSize: "13px" }}
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("all");
              setStatusFilter("all");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="form-card" style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "25px", maxWidth: "600px" }}>
        <h2>Add Utility Bill</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <select
            name="tenant_id"
            value={form.tenant_id}
            onChange={handleChange}
            required
            style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
          >
            <option value="">Select Tenant</option>

            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>

          <select
            name="utility_type"
            value={form.utility_type}
            onChange={handleChange}
            style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
          >
            <option value="Electricity">Electricity</option>
            <option value="Water">Water</option>
            <option value="Gas">Gas</option>
            <option value="Internet">Internet</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="text"
            name="connection_number"
            placeholder="Connection Number"
            value={form.connection_number}
            onChange={handleChange}
            style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
          />

          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={form.amount}
            onChange={handleChange}
            required
            style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
          />

          <label style={{ fontWeight: 600, marginTop: "5px" }}>Due Date</label>

          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            required
            style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
          />

          <label style={{ fontWeight: 600, marginTop: "5px" }}>Payment Date (optional)</label>

          <input
            type="date"
            name="payment_date"
            value={form.payment_date}
            onChange={handleChange}
            style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
          />

          <textarea
            name="notes"
            placeholder="Notes"
            value={form.notes}
            onChange={handleChange}
            style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
          />

          <button type="submit">
            Add Utility Bill
          </button>
        </form>
      </div>

      {editingBill && (
        <div className="form-card" style={{ background: "#ffffff", padding: "25px", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "25px", maxWidth: "600px" }}>
          <h2>Edit Utility Bill</h2>

          <form onSubmit={updateBill} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontWeight: 600 }}>Tenant</label>

            <select
              name="tenant_id"
              value={editForm.tenant_id}
              onChange={handleEditChange}
              required
              style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
            >
              <option value="">Select Tenant</option>

              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>

            <label style={{ fontWeight: 600 }}>Utility Type</label>

            <select
              name="utility_type"
              value={editForm.utility_type}
              onChange={handleEditChange}
              style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
            >
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Gas">Gas</option>
              <option value="Internet">Internet</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="text"
              name="connection_number"
              placeholder="Connection Number"
              value={editForm.connection_number}
              onChange={handleEditChange}
              style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
            />

            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={editForm.amount}
              onChange={handleEditChange}
              required
              style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
            />

            <label style={{ fontWeight: 600 }}>Due Date</label>

            <input
              type="date"
              name="due_date"
              value={editForm.due_date}
              onChange={handleEditChange}
              required
              style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
            />

            <label style={{ fontWeight: 600 }}>Payment Date</label>

            <input
              type="date"
              name="payment_date"
              value={editForm.payment_date}
              onChange={handleEditChange}
              style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
            />

            <textarea
              name="notes"
              placeholder="Notes"
              value={editForm.notes}
              onChange={handleEditChange}
              style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "15px" }}
            />

            <button type="submit">
              Save Changes
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={() => setEditingBill(null)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="payment-list">
        {bills.length === 0 ? (

          <div className="empty-property">
            <h3>No utility bills yet</h3>
            <p>Add your first utility bill.</p>
          </div>

        ) : filteredBills.length === 0 ? (

          <div className="empty-property">
            <h3>No matching utility bills found</h3>
            <p>Try adjusting your search query, utility type filter, or status filter.</p>
          </div>

        ) : (

          filteredBills.map((bill) => {
            const tenantName = getTenantName(bill.tenant_id);

            return (
              <div className="payment-card" key={bill.id}>
                <h3>{bill.utility_type} Bill</h3>

                <p style={{ color: "#6b7280", margin: "4px 0 12px" }}>
                  <strong>Tenant:</strong> {tenantName}
                </p>

                <div className="payment-details" style={{ borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
                  <div>
                    <span>Connection No</span>
                    <strong>{bill.connection_number || "N/A"}</strong>
                  </div>

                  <div>
                    <span>Amount</span>
                    <strong style={{ fontSize: "18px" }}>₹{bill.amount.toLocaleString()}</strong>
                  </div>

                  <div>
                    <span>Due Date</span>
                    <strong>{bill.due_date}</strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong className={`status-${bill.status.toLowerCase()}`}>
                      {bill.status}
                    </strong>
                  </div>
                </div>

                {bill.notes && (
                  <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "10px", fontStyle: "italic" }}>
                    Notes: {bill.notes}
                  </p>
                )}

                <div style={{ marginTop: "12px" }}>
                  {bill.status !== "Paid" && (
                    <button
                      className="pay-button"
                      onClick={() => markAsPaid(bill.id)}
                    >
                      Mark as Paid
                    </button>
                  )}

                  <button
                    className="edit-button"
                    onClick={() => startEditing(bill)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => deleteBill(bill.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Utilities;
