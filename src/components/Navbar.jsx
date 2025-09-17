// src/components/Navbar.jsx
import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { usePeriod } from "../data/PeriodContext";
import "../style/Navbar.css";

const Navbar = () => {
  const { month, setMonth } = usePeriod();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const newMonth = e.target.value;
    setMonth(newMonth);

    // refresh halaman dengan navigate ke route yg sama
    navigate(location.pathname, { replace: true });
  };

  return (
    <nav className="navbar shadow-sm px-4 py-2 flex items-center justify-between bg-white rounded-xl mb-4">
      {/* Menu Links */}
      <div className="flex items-center gap-4">
        <NavLink
          to="/lcr"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          LCR
        </NavLink>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/ncf"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          NCF
        </NavLink>
      </div>

      {/* Periode Selector */}
      <div className="periode-selector flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg shadow-sm">
        <label htmlFor="periode" className="font-medium text-gray-700">
          Periode:
        </label>
        <select
          id="periode"
          value={month}
          onChange={handleChange}
          className="border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
        >
          <option value="2025-08">Agustus 2025</option>
          <option value="2025-07">Juli 2025</option>
          <option value="2025-06">Juni 2025</option>
        </select>
      </div>
    </nav>
  );
};

export default Navbar;
