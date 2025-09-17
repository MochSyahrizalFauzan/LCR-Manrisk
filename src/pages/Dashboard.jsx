// src/pages/Dashboard.jsx
import React from "react";
import Visualisasi from "../components/Visualisasi";
import "../assets/css/Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard-page">
      {/* <h2 className="mb-4">Dashboard</h2> */}
      
      {/* Panggil komponen Visualisasi */}
      <Visualisasi />
    </div>
  );
}

export default Dashboard;
