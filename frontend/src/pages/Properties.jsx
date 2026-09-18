import { useEffect, useState } from "react";
import api from "../api/client";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency } from "../utils/currency";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Home,
  Users,
  Edit3,
  Trash2,
  X,
  Check,
} from "lucide-react";
import "./Properties.css";

function Properties() {
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    unit_number: "",
    monthly_rent: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    unit_number: "",
    monthly_rent: "",
  });

  const fetchProperties = async () => {
    try {
      const response = await api.get("/properties/");
      setProperties(response.data || []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load properties."));
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get("/tenants/");
      setTenants(response.data || []);
    } catch (err) {
      // Silently swallow tenant count fetch failure for properties card count
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    await Promise.all([fetchProperties(), fetchTenants()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
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
      await api.post("/properties/", {
        name: formData.name.trim(),
        address: formData.address.trim(),
        unit_number: formData.unit_number.trim(),
        monthly_rent: Number(formData.monthly_rent),
      });

      setFormData({
        name: "",
        address: "",
        unit_number: "",
        monthly_rent: "",
      });

      setShowForm(false);
      fetchProperties();
    } catch (err) {
      alert(getApiErrorMessage(err, "Could not create property."));
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (property) => {
    setEditingProperty(property);
    setEditForm({
      name: property.name,
      address: property.address,
      unit_number: property.unit_number || "",
      monthly_rent: property.monthly_rent,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const updateProperty = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put(`/properties/${editingProperty.id}`, {
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        unit_number: editForm.unit_number.trim(),
        monthly_rent: Number(editForm.monthly_rent),
      });

      setEditingProperty(null);
      fetchProperties();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to update property."));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProperty = async (propertyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/properties/${propertyId}`);
      fetchProperties();
    } catch (err) {
      alert(getApiErrorMessage(err, "Failed to delete property."));
    }
  };

  const filteredProperties = properties.filter((property) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      property.name.toLowerCase().includes(query) ||
      property.address.toLowerCase().includes(query) ||
      (property.unit_number &&
        property.unit_number.toLowerCase().includes(query))
    );
  });

  return (
    <div className="properties-container">
      {/* Page Header */}
      <div className="page-header-wrapper">
        <div className="page-title-area">
          <h1>Properties</h1>
          <p className="page-subtitle">
            Manage your rental properties and units
          </p>
        </div>

        <button
          className="primary-add-button"
          onClick={() => {
            setShowForm(!showForm);
            setEditingProperty(null);
          }}
        >
          <Plus size={18} /> {showForm ? "Cancel Add" : "Add Property"}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="properties-filter-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon-left" />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search properties by name, address, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {searchQuery && (
          <button
            className="clear-search-btn"
            onClick={() => setSearchQuery("")}
          >
            Clear Search
          </button>
        )}
      </div>

      {error && (
        <div className="login-error-banner" style={{ marginBottom: "24px" }}>
          {error}
        </div>
      )}

      {/* Edit Property Form */}
      {editingProperty && (
        <div className="property-form-card">
          <div className="form-header-area">
            <Building2 size={20} style={{ color: "#2563eb" }} />
            <h3>Edit Property</h3>
          </div>

          <form onSubmit={updateProperty}>
            <div className="property-form-grid">
              <div className="form-field-group">
                <label>Property Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Property Name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Unit Number</label>
                <input
                  type="text"
                  name="unit_number"
                  placeholder="A-101"
                  value={editForm.unit_number}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-field-group form-full-width">
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="form-field-group form-full-width">
                <label>Monthly Rent (₹) *</label>
                <input
                  type="number"
                  name="monthly_rent"
                  placeholder="25000"
                  value={editForm.monthly_rent}
                  onChange={handleEditChange}
                  required
                  min="0"
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
                onClick={() => setEditingProperty(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Property Form */}
      {showForm && !editingProperty && (
        <div className="property-form-card">
          <div className="form-header-area">
            <Building2 size={20} style={{ color: "#2563eb" }} />
            <h3>Add New Property</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="property-form-grid">
              <div className="form-field-group">
                <label>Property Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Sunrise Heights"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Unit Number</label>
                <input
                  type="text"
                  name="unit_number"
                  placeholder="A-101"
                  value={formData.unit_number}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field-group form-full-width">
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Bangalore"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field-group form-full-width">
                <label>Monthly Rent (₹) *</label>
                <input
                  type="number"
                  name="monthly_rent"
                  placeholder="25000"
                  value={formData.monthly_rent}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>
            </div>

            <div className="form-actions-row">
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                <Check size={16} /> {submitting ? "Saving..." : "Save Property"}
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

      {/* Property Cards Grid / Skeletons / Empty State */}
      {loading ? (
        <div className="properties-cards-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-box"
              style={{ height: "220px", borderRadius: "16px" }}
            />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="dashboard-empty-state">
          <Building2 size={40} style={{ color: "#94a3b8" }} />
          <h3>No properties yet</h3>
          <p>Click "Add Property" to create your first rental property.</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="dashboard-empty-state">
          <Search size={32} style={{ color: "#94a3b8" }} />
          <h3>No matching properties found</h3>
          <p>Try searching with another property name or address.</p>
        </div>
      ) : (
        <div className="properties-cards-grid">
          {filteredProperties.map((property) => {
            const tenantCount = tenants.filter(
              (t) => t.property_id === property.id
            ).length;

            return (
              <div className="property-card-saas" key={property.id}>
                <div>
                  <div className="property-card-top">
                    <div className="property-building-icon">
                      <Building2 size={24} />
                    </div>
                    <div className="property-header-info">
                      <h3>{property.name}</h3>
                      <p className="property-address">
                        <MapPin size={13} /> {property.address}
                      </p>
                    </div>
                  </div>

                  <div className="property-details-box">
                    <div className="detail-pill">
                      <span className="label">Unit</span>
                      <span className="value">
                        {property.unit_number || "Single Unit"}
                      </span>
                    </div>

                    <div className="detail-pill">
                      <span className="label">Tenants</span>
                      <span className="value" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Users size={14} style={{ color: "#64748b" }} />
                        {tenantCount}
                      </span>
                    </div>

                    <div className="detail-pill">
                      <span className="label">Rent / Month</span>
                      <span className="value property-rent-highlight">
                        {formatCurrency(property.monthly_rent)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="property-card-actions">
                  <button
                    className="action-edit-btn"
                    onClick={() => startEditing(property)}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    className="action-delete-btn"
                    onClick={() => deleteProperty(property.id)}
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

export default Properties;
