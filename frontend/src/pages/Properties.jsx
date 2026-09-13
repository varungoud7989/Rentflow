import { useEffect, useState } from "react";
import axios from "axios";

function Properties() {
  const [properties, setProperties] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    unit_number: "",
    monthly_rent: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    unit_number: "",
    monthly_rent: "",
  });

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
        "http://127.0.0.1:8000/properties/",
        {
          name: formData.name,
          address: formData.address,
          unit_number: formData.unit_number,
          monthly_rent: Number(formData.monthly_rent),
        }
      );

      setFormData({
        name: "",
        address: "",
        unit_number: "",
        monthly_rent: "",
      });

      setShowForm(false);
      fetchProperties();

    } catch (error) {
      console.error("Error creating property:", error);
      alert("Could not create property.");
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

    try {
      await axios.put(
        `http://127.0.0.1:8000/properties/${editingProperty.id}`,
        {
          name: editForm.name,
          address: editForm.address,
          unit_number: editForm.unit_number,
          monthly_rent: Number(editForm.monthly_rent),
        }
      );

      alert("Property updated successfully!");

      setEditingProperty(null);
      fetchProperties();
    } catch (error) {
      console.error(error);
      alert("Failed to update property.");
    }
  };

  const deleteProperty = async (propertyId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this property?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(
        `http://127.0.0.1:8000/properties/${propertyId}`
      );

      alert("Property deleted successfully!");

      fetchProperties();
    } catch (error) {
      console.error(error);
      alert("Failed to delete property.");
    }
  };

  const filteredProperties = properties.filter((property) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      property.name.toLowerCase().includes(query) ||
      property.address.toLowerCase().includes(query)
    );
  });

  return (
    <div className="properties-page">

      <div className="page-header">
        <div>
          <h2>Properties</h2>
          <p>Manage your rental properties</p>
        </div>

        <button onClick={() => setShowForm(!showForm)}>
          + Add Property
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search properties by name or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="cancel-button"
            style={{ margin: 0, padding: "8px 14px", fontSize: "13px" }}
            onClick={() => setSearchQuery("")}
          >
            Clear
          </button>
        )}
      </div>

      {editingProperty && (
        <div className="form-card">
          <h2>Edit Property</h2>

          <form onSubmit={updateProperty}>

            <input
              type="text"
              name="name"
              placeholder="Property Name"
              value={editForm.name}
              onChange={handleEditChange}
              required
            />

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={editForm.address}
              onChange={handleEditChange}
              required
            />

            <input
              type="text"
              name="unit_number"
              placeholder="Unit Number"
              value={editForm.unit_number}
              onChange={handleEditChange}
            />

            <input
              type="number"
              name="monthly_rent"
              placeholder="Monthly Rent"
              value={editForm.monthly_rent}
              onChange={handleEditChange}
              required
            />

            <button type="submit">
              Save Changes
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={() => setEditingProperty(null)}
            >
              Cancel
            </button>

          </form>
        </div>
      )}

      {showForm && (
        <div className="property-form">

          <h3>Add New Property</h3>

          <form onSubmit={handleSubmit}>

            <label>
              Property Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Green Residency"
              value={formData.name}
              onChange={handleChange}
              required
            />

            <label>
              Address
            </label>

            <input
              type="text"
              name="address"
              placeholder="Hyderabad"
              value={formData.address}
              onChange={handleChange}
              required
            />

            <label>
              Unit Number
            </label>

            <input
              type="text"
              name="unit_number"
              placeholder="A-101"
              value={formData.unit_number}
              onChange={handleChange}
            />

            <label>
              Monthly Rent
            </label>

            <input
              type="number"
              name="monthly_rent"
              placeholder="12000"
              value={formData.monthly_rent}
              onChange={handleChange}
              required
            />

            <div className="form-buttons">

              <button type="submit">
                Save Property
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

      <div className="property-list">

        {properties.length === 0 ? (

          <div className="empty-property">
            <h3>No properties yet</h3>
            <p>Add your first property to RentFlow.</p>
          </div>

        ) : filteredProperties.length === 0 ? (

          <div className="empty-property" style={{ gridColumn: "1 / -1" }}>
            <h3>No matching properties found</h3>
            <p>Try searching for a different property name or address.</p>
          </div>

        ) : (

          filteredProperties.map((property) => (

            <div
              className="property-card"
              key={property.id}
            >

              <div className="property-icon">
                🏠
              </div>

              <div>
                <h3>{property.name}</h3>

                <p>{property.address}</p>

                <p>
                  Unit: {property.unit_number || "Not specified"}
                </p>

                <strong>
                  ₹{property.monthly_rent.toLocaleString()}
                </strong>
                <span> / month</span>

                <div className="property-actions">
                  <button
                    className="edit-button"
                    onClick={() => startEditing(property)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => deleteProperty(property.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default Properties;
