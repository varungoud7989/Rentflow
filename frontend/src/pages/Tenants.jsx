import { useEffect, useState } from "react";
import api from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency } from "../utils/currency";
import {
  Users,
  UserPlus,
  Search,
  Building2,
  Phone,
  Calendar,
  CreditCard,
  Edit3,
  Trash2,
  Check,
  Filter,
} from "lucide-react";
import "./Tenants.css";

function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    rent_amount: "",
    rent_due_day: 5,
    move_in_date: "",
    property_id: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    rent_amount: "",
    rent_due_day: "",
    move_in_date: "",
    property_id: "",
  });

  const fetchTenants = async () => {
    try {
      const response = await api.get("/tenants/");
      setTenants(response.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load tenants."));
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties/");
      setProperties(response.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load properties."));
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError("");
      await Promise.all([fetchTenants(), fetchProperties()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/tenants/", {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        rent_amount: Number(formData.rent_amount),
        rent_due_day: Number(formData.rent_due_day),
        move_in_date: formData.move_in_date || null,
        property_id: Number(formData.property_id),
      });

      setFormData({
        name: "",
        phone: "",
        rent_amount: "",
        rent_due_day: 5,
        move_in_date: "",
        property_id: "",
      });

      setShowForm(false);
      fetchTenants();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not create tenant."));
    } finally {
      setSubmitting(false);
    }
  };

  const getProperty = (propertyId) => {
    return properties.find((property) => property.id === propertyId);
  };

  const startEditing = (tenant) => {
    setEditingTenant(tenant);
    setEditForm({
      name: tenant.name,
      phone: tenant.phone || "",
      rent_amount: tenant.rent_amount,
      rent_due_day: tenant.rent_due_day,
      move_in_date: tenant.move_in_date || "",
      property_id: tenant.property_id,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const updateTenant = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/tenants/${editingTenant.id}`, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        rent_amount: Number(editForm.rent_amount),
        rent_due_day: Number(editForm.rent_due_day),
        move_in_date: editForm.move_in_date || null,
        property_id: Number(editForm.property_id),
      });

      setEditingTenant(null);
      fetchTenants();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to update tenant."));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTenant = async (tenantId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this tenant? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/tenants/${tenantId}`);
      fetchTenants();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to delete tenant."));
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const query = searchQuery.toLowerCase().trim();

    const matchesQuery =
      !query ||
      tenant.name.toLowerCase().includes(query) ||
      (tenant.phone && tenant.phone.toLowerCase().includes(query));

    const matchesProperty =
      propertyFilter === "all" ||
      tenant.property_id === Number(propertyFilter);

    return matchesQuery && matchesProperty;
  });

  return (
    <div className="tenants-container">
      {/* Page Header */}
      <div className="tenants-header-wrapper">
        <div className="tenants-title-area">
          <h1>Tenants</h1>
          <p className="tenants-subtitle">
            Manage tenant profiles and rental details
          </p>
        </div>

        <button
          className="primary-add-button"
          onClick={() => {
            setShowForm(!showForm);
            setEditingTenant(null);
          }}
        >
          <UserPlus size={18} /> {showForm ? "Cancel Add" : "Add Tenant"}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="tenants-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-left" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search tenants by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={15} style={{ color: "#64748b" }} />
          <select
            className="filter-select-property"
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            aria-label="Filter by property"
          >
            <option value="all">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.unit_number ? `(${p.unit_number})` : ""}
              </option>
            ))}
          </select>
        </div>

        {(searchQuery || propertyFilter !== "all") && (
          <button
            className="clear-search-btn"
            onClick={() => {
              setSearchQuery("");
              setPropertyFilter("all");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {error && (
        <div className="login-error-banner" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Edit Tenant Form */}
      {editingTenant && (
        <div className="tenant-form-card">
          <div className="form-header-area">
            <Users size={20} style={{ color: "#2563eb" }} />
            <h3>Edit Tenant</h3>
          </div>

          <form onSubmit={updateTenant}>
            <div className="tenant-form-grid">
              <div className="form-field-group">
                <label>Tenant Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Tenant Name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={editForm.phone}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-field-group">
                <label>Assigned Property *</label>
                <select
                  name="property_id"
                  value={editForm.property_id}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}{" "}
                      {property.unit_number ? `(${property.unit_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label>Monthly Rent (₹) *</label>
                <input
                  type="number"
                  name="rent_amount"
                  placeholder="Rent Amount"
                  value={editForm.rent_amount}
                  onChange={handleEditChange}
                  required
                  min="0"
                />
              </div>

              <div className="form-field-group">
                <label>Rent Due Day (1-31) *</label>
                <input
                  type="number"
                  name="rent_due_day"
                  placeholder="5"
                  min="1"
                  max="31"
                  value={editForm.rent_due_day}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Move-in Date</label>
                <input
                  type="date"
                  name="move_in_date"
                  value={editForm.move_in_date}
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
                onClick={() => setEditingTenant(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Tenant Form */}
      {showForm && !editingTenant && (
        <div className="tenant-form-card">
          <div className="form-header-area">
            <UserPlus size={20} style={{ color: "#2563eb" }} />
            <h3>Add New Tenant</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="tenant-form-grid">
              <div className="form-field-group">
                <label>Tenant Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Ananya Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="9876501234"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field-group">
                <label>Assigned Property *</label>
                <select
                  name="property_id"
                  value={formData.property_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}{" "}
                      {property.unit_number ? `(${property.unit_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field-group">
                <label>Monthly Rent (₹) *</label>
                <input
                  type="number"
                  name="rent_amount"
                  placeholder="25000"
                  value={formData.rent_amount}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>

              <div className="form-field-group">
                <label>Rent Due Day (1-31) *</label>
                <input
                  type="number"
                  name="rent_due_day"
                  min="1"
                  max="31"
                  value={formData.rent_due_day}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Move-in Date</label>
                <input
                  type="date"
                  name="move_in_date"
                  value={formData.move_in_date}
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
                <Check size={16} /> {submitting ? "Saving..." : "Save Tenant"}
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

      {/* Tenant Cards Grid / Skeletons / Empty State */}
      {loading ? (
        <div className="tenants-cards-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-box"
              style={{ height: "240px", borderRadius: "16px" }}
            />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <div className="dashboard-empty-state">
          <Users size={40} style={{ color: "#94a3b8" }} />
          <h3>No tenants yet</h3>
          <p>Click "Add Tenant" to create your first tenant profile.</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="dashboard-empty-state">
          <Search size={32} style={{ color: "#94a3b8" }} />
          <h3>No matching tenants found</h3>
          <p>
            Try searching for a different tenant name, phone number, or property
            filter.
          </p>
        </div>
      ) : (
        <div className="tenants-cards-grid">
          {filteredTenants.map((tenant) => {
            const property = getProperty(tenant.property_id);

            return (
              <div className="tenant-card-saas" key={tenant.id}>
                <div>
                  <div className="tenant-card-top">
                    <div className="tenant-avatar-icon">
                      <Users size={24} />
                    </div>
                    <div className="tenant-header-info">
                      <h3>{tenant.name}</h3>
                      <p className="tenant-property-tag">
                        <Building2 size={13} />{" "}
                        {property ? property.name : "Property not assigned"}
                        {property?.unit_number
                          ? ` • Unit ${property.unit_number}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="tenant-meta-list">
                    {tenant.phone && (
                      <div className="meta-row">
                        <span>Phone:</span>
                        <strong>
                          <Phone size={12} style={{ marginRight: "4px" }} />
                          {tenant.phone}
                        </strong>
                      </div>
                    )}

                    <div className="meta-row">
                      <span>Monthly Rent:</span>
                      <span className="rent-value">
                        {formatCurrency(tenant.rent_amount)}
                      </span>
                    </div>

                    <div className="meta-row">
                      <span>Rent Due Day:</span>
                      <strong>
                        <Calendar size={12} style={{ marginRight: "4px" }} />
                        {tenant.rent_due_day}th of every month
                      </strong>
                    </div>

                    {tenant.move_in_date && (
                      <div className="meta-row">
                        <span>Move-in Date:</span>
                        <strong>{tenant.move_in_date}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="property-card-actions">
                  <button
                    className="action-edit-btn"
                    onClick={() => startEditing(tenant)}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    className="action-delete-btn"
                    onClick={() => deleteTenant(tenant.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Tenants;
