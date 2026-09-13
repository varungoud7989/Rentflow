import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import Tenants from "./pages/Tenants";
import Payments from "./pages/Payments";
import Utilities from "./pages/Utilities";
import "./App.css";

function App() {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="app">

      <header className="header">

        <div>
          <h1>🏠 RentFlow</h1>
          <p>Smart Rental & Utility Management</p>
        </div>

        <nav>
          <button onClick={() => setPage("dashboard")}>
            Dashboard
          </button>

          <button onClick={() => setPage("properties")}>
            Properties
          </button>

          <button onClick={() => setPage("tenants")}>
            Tenants
          </button>

          <button onClick={() => setPage("payments")}>
            Payments
          </button>

          <button onClick={() => setPage("utilities")}>
            Utilities
          </button>
        </nav>

      </header>

      {page === "dashboard" && <Dashboard />}

      {page === "properties" && (
        <Properties />
      )}

      {page === "tenants" && (
        <Tenants />
      )}

      {page === "payments" && (
        <Payments />
      )}

      {page === "utilities" && (
        <Utilities />
      )}

    </div>
  );
}

export default App;
