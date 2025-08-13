import React from 'react';
import { Link } from 'react-router-dom';
import "../style/Dashboard.css";


const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>MENU</h2>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/ppop">PPOP</Link></li>
        <li>Laporan
            <ul>
                <li><Link to="/tahunan">Tahunan</Link></li>
                <li><Link to="/bulanan">Bulanan</Link></li>
            </ul>
        </li>
        <li>
          Laporan Keuangan
          <ul>
            <li><Link to="/monitoring">Monitoring Laporan Keuangan</Link></li>
          </ul>
        <li><Link to="/lcr">LCR</Link></li>
        <ul>
          <li><Link to="/lcr">HQLA</Link></li>
          <li><Link to="/ncf">Net Cash Flow</Link></li>
        </ul>
        </li>
        <li><Link to="/analytics">Data Analytics</Link></li>
        {/* <li><Link to="/test">TEST</Link></li> */}
      </ul>
    </div>
  );
};

export default Sidebar;
