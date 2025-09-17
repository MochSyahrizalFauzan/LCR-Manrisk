// src/components/Navbar.jsx
import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { usePeriod } from "../data/PeriodContext";
import "../assets/css/navbar.css";

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
    <nav className="navbar">
        <NavLink to="/lcr" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          LCR
        </NavLink>

        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          Dashboard
        </NavLink>
    </nav>
  );
};

export default Navbar;
