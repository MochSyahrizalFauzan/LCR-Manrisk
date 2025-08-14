import React from 'react';
import { Link } from 'react-router-dom';
import "../style/Dashboard.css";


const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>MENU</h2>
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li>LCR
          <ul>
            <li><Link to="/lcr">HQLA</Link></li>
            <li><Link to="/ncf">Net Cash Flow</Link></li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
