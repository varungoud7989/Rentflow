import { useEffect, useState } from "react";
import axios from "axios";

function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    rent_amount: "",
    rent_due_day: "",
    move_in_date: "",
    property_id: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    rent_amount: "",
    rent_due_day: 5,
    move_in_date: "",
    property_id: "",
  });

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

  const fetchProperties = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/properties/"
      );

      setProperties(response.data);
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchProperties();
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
        "http://127.0.0.1:8000/tenants/",
        {
          name: formData.name,
          phone: formData.phone,
          rent_amount: Number(formData.rent_amount),
          rent_due_day: Number(formData.rent_due_day),
          move_in_date: formData.move_in_date || null,
          property_id: Number(formData.property_id),
        }
      );

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

    } catch (error) {
      console.error("Error creating tenant:", error);

      if (error.response) {
        alert(
          error.response.data.detail ||
          "Could not create tenant."
        );
      } else {
        alert("Could not connect to RentFlow backend.");
      }
    }
  };

  const getProperty = (propertyId) => {
    return properties.find(
      (property) => property.id === propertyId
    );
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

    try {
      await axios.put(
        `http://127.0.0.1:8000/tenants/${editingTenant.id}`,
        {
          name: editForm.name,
          phone: editForm.phone,
          rent_amount: Number(editForm.rent_amount),
          rent_due_day: Number(editForm.rent_due_day),
          move_in_date: editForm.move_in_date || null,
          property_id: Number(editForm.property_id),
        }
      );

      alert("Tenant updated successfully!");

      setEditingTenant(null);
      fetchTenants();
    } catch (error) {
      console.error(error);
      alert("Failed to update tenant.");
    }
  };

  const deleteTenant = async (tenantId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this tenant?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `http://127.0.0.1:8000/tenants/${tenantId}`
      );

      alert("Tenant deleted successfully!");

      fetchTenants();
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.detail ||
        "Failed to delete tenant.";

      alert(message);
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
    <main className="tenants-page">

      <div className="page-header">
        <div>
          <h2>Tenants</h2>
          <p>Manage your rental tenants</p>
        </div>

        <button onClick={() => setShowForm(!showForm)}>
          + Add Tenant
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search tenants by name or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="filter-select"
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
        >
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.unit_number ? `(${p.unit_number})` : ""}
            </option>
          ))}
        </select>

        {(searchQuery || propertyFilter !== "all") && (
          <button
            className="cancel-button"
            style={{ margin: 0, padding: "8px 14px", fontSize: "13px" }}
            onClick={() => {
              setSearchQuery("");
              setPropertyFilter("all");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {editingTenant && (
        <div className="form-card">
          <h2>Edit Tenant</h2>

          <form onSubmit={updateTenant}>

            <input
              type="text"
              name="name"
              placeholder="Tenant Name"
              value={editForm.name}
              onChange={handleEditChange}
              required
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={editForm.phone}
              onChange={handleEditChange}
            />

            <input
              type="number"
              name="rent_amount"
              placeholder="Rent Amount"
              value={editForm.rent_amount}
              onChange={handleEditChange}
              required
            />

            <input
              type="number"
              name="rent_due_day"
              placeholder="Rent Due Day"
              min="1"
              max="31"
              value={editForm.rent_due_day}
              onChange={handleEditChange}
              required
            />

            <label>Move-in Date</label>

            <input
              type="date"
              name="move_in_date"
              value={editForm.move_in_date}
              onChange={handleEditChange}
            />

            <label>Property</label>

            <select
              name="property_id"
              value={editForm.property_id}
              onChange={handleEditChange}
              required
            >
              <option value="">Select Property</option>

              {properties.map((property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.name}
                </option>
              ))}
            </select>

            <button type="submit">
              Save Changes
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={() => setEditingTenant(null)}
            >
              Cancel
            </button>

          </form>
        </div>
      )}

      {showForm && (
        <div className="tenant-form">

          <h3>Add New Tenant</h3>

          <form onSubmit={handleSubmit}>

            <label>Tenant Name</label>

            <input
              type="text"
              name="name"
              placeholder="Ravi Kumar"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <label>Phone Number</label>

            <input
              type="tel"
              name="phone"
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleChange}
            />

            <label>Property</label>

            <select
              name="property_id"
              value={formData.property_id}
              onChange={handleChange}
              required
            >
              <option value="">
                Select Property
              </option>

              {properties.map((property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.name}
                  {property.unit_number
                    ? ` - ${property.unit_number}`
                    : ""}
                </option>
              ))}
            </select>

            <label>Monthly Rent</label>

            <input
              type="number"
              name="rent_amount"
              placeholder="12000"
              value={formData.rent_amount}
              onChange={handleChange}
              required
            />

            <label>Rent Due Day</label>

            <input
              type="number"
              name="rent_due_day"
              min="1"
              max="31"
              value={formData.rent_due_day}
              onChange={handleChange}
              required
            />

            <label>Move-in Date</label>

            <input
              type="date"
              name="move_in_date"
              value={formData.move_in_date}
              onChange={handleChange}
            />

            <div className="form-buttons">

              <button type="submit">
                Save Tenant
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

      <div className="tenant-list">

        {tenants.length === 0 ? (

          <div className="empty-property">
            <h3>No tenants yet</h3>
            <p>Add your first tenant to RentFlow.</p>
          </div>

        ) : filteredTenants.length === 0 ? (

          <div className="empty-property" style={{ gridColumn: "1 / -1" }}>
            <h3>No matching tenants found</h3>
            <p>Try searching for a different tenant name, phone number, or property filter.</p>
          </div>

        ) : (

          filteredTenants.map((tenant) => {

            const property = getProperty(
              tenant.property_id
            );

            return (
              <div
                className="tenant-card"
                key={tenant.id}
              >

                <div className="tenant-avatar">
                  👤
                </div>

                <div className="tenant-info">

                  <h3>{tenant.name}</h3>

                  <p>
                    🏠{" "}
                    {property
                      ? property.name
                      : "Property not found"}

                    {property?.unit_number
                      ? ` • ${property.unit_number}`
                      : ""}
                  </p>

                  {tenant.phone && (
                    <p>📞 {tenant.phone}</p>
                  )}

                  <div className="tenant-details">

                    <strong>
                      ₹{tenant.rent_amount.toLocaleString()}
                    </strong>

                    <span>
                      / month
                    </span>

                    <span>
                      Due: {tenant.rent_due_day}th
                    </span>

                  </div>

                  <button
                    className="edit-button"
                    onClick={() => startEditing(tenant)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => deleteTenant(tenant.id)}
                  >
                    Delete
                  </button>

                </div>

              </div>
            );
          })
        )}

      </div>

    </main>
  );
}

export default Tenants;
