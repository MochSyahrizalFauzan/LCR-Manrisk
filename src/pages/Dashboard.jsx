import React from 'react';
import Sidebar from '../components/sidebar';
import '../style/Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h1>Welcome Back!</h1>
          <p>Sistem Informasi Laporan Keuangan Bjb Syariah</p>
        </div>
        <div className="user-info">
          <span>User: Irham Khalifah Putra</span>
          <span>NPF: 12,345,678</span>
        </div>
        <div className="financials">
          <FinancialBox title="Asset" amount="Rp 12,345,678" />
          <FinancialBox title="Pembiayaan" amount="Rp 8,765,432" />
          <FinancialBox title="DPK" amount="Rp 5,432,109" />
          <FinancialBox title="Laba Rugi" amount="Rp 1,234,567" />
        </div>
        <div className="charts">
          <ChartSection title="NPF" />
          <ChartSection title="Struktur Dana" />
        </div>
      </div>
    </div>
  );
};

const FinancialBox = ({ title, amount }) => (
  <div className="financial-box">
    <h3>{title}</h3>
    <p>{amount}</p>
  </div>
);

const ChartSection = ({ title }) => (
  <div className="chart-section">
    <h3>{title}</h3>
    <div className="chart-placeholder">
      [{title} bar chart placeholder]
    </div>
  </div>
);

export default Dashboard;
