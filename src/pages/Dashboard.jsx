import React from 'react';
import Sidebar from '../components/sidebar';
import '../style/Dashboard.css';

// Chart.js
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="header">
          <h1>Welcome Back!</h1>
          <p>Sistem Informasi Laporan Keuangan Bjb Syariah</p>
        </div>

        <div className="financials">
          <FinancialBox title="Asset" amount="Rp 12,345,678" />
          <FinancialBox title="Pembiayaan" amount="Rp 8,765,432" />
          <FinancialBox title="DPK" amount="Rp 5,432,109" />
          <FinancialBox title="Laba Rugi" amount="Rp 1,234,567" />
        </div>

        <div className="charts">
          <ChartSectionNPF title="NPF" />
          <ChartSectionDana title="Struktur Dana" />
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

// NPF Chart
const ChartSectionNPF = ({ title }) => {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [
      {
        label: 'NPF (%)',
        data: [2.5, 2.8, 3.1, 2.9, 3.4, 3.0],
        backgroundColor: '#1976D2',
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: title }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => value + '%'
        }
      }
    }
  };

  return (
    <div className="chart-section">
      <Bar data={data} options={options} />
    </div>
  );
};

// Struktur Dana Chart
const ChartSectionDana = ({ title }) => {
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [
      {
        label: 'Giro',
        data: [120, 140, 150, 130, 160, 170],
        backgroundColor: '#42A5F5',
        borderRadius: 6
      },
      {
        label: 'Tabungan',
        data: [200, 210, 220, 205, 215, 225],
        backgroundColor: '#66BB6A',
        borderRadius: 6
      },
      {
        label: 'Deposito',
        data: [300, 320, 310, 330, 340, 350],
        backgroundColor: '#FFA726',
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: true, text: title }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => 'Rp ' + value + ' M'
        }
      }
    }
  };

  return (
    <div className="chart-section">
      <Bar data={data} options={options} />
    </div>
  );
};

export default Dashboard;
