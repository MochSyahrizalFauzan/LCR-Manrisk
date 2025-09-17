// src/components/Visualisasi.jsx
import React, { useEffect, useState } from "react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis, PieChart, Pie, Cell, BarChart, Bar
} 
from "recharts";
import { Banknote, TrendingDown, TrendingUp } from "lucide-react";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import {motion} from "framer-motion";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

function Visualisasi() {
  const [periodes, setPeriodes] = useState([]);
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [inMillions, setInMillions] = useState(true);

// format angka sesuai Excel (pakai koma ribuan)
  const formatNumber = (value) => {
  if ((!value && value !== 0) || isNaN(value)) return "-";

  const scaled = inMillions ? value / 100 : value; // jika toggle true → jutaan
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(scaled);
  };

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  // Fungsi untuk mempersingkat angka
  const formatShortNumber = (value) => {
    if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(1) + "M";
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(1) + "K";
    }
    return value;
  };

  // Fungsi untuk mengubah periode ke nama bulan
const formatPeriodeToMonth = (periode) => {
  if (!periode) return "";
  const [year, month] = periode.split("-");
  return format(new Date(year, month - 1), "MMMM yyyy", { locale: localeID });
};

  useEffect(() => {
    fetch("http://localhost:5000/api/periodes")
      .then((res) => res.json())
      .then((data) => {
        setPeriodes(data);
        if (data.length > 0) setSelectedPeriode(data[0].periode);
      });
  }, []);

  useEffect(() => {
    if (!selectedPeriode) return;
    fetch(`http://localhost:5000/api/lcr_summary/${selectedPeriode}`)
      .then((res) => res.json())
      .then((res) => setSummary(res.data));
  }, [selectedPeriode]);

  useEffect(() => {
    fetch("http://localhost:5000/api/lcr_trend")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((d) => ({
          ...d,
          jumlah_hqla: Number(d.jumlah_hqla),
          jumlah_net_cash_outflow: Number(d.jumlah_net_cash_outflow),
          nilai_lcr: Number(d.nilai_lcr),
        }));
        setTrendData(formatted);
      });
  }, []);

  return (
    <div className="container">
      <h2 className="fw-bold text-primary mb-4">📊 Dashboard Likuiditas (LCR)</h2>

      <div className="d-flex justify-content-end mb-3">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => setInMillions(!inMillions)}
        >
          {inMillions ? "Tampilkan Rupiah penuh" : "Tampilkan dalam Jutaan"}
        </button>
      </div>


      {/* Dropdown Periode */}
      <div className="mb-4">
        <label className="form-label fw-semibold text-secondary">Pilih Periode</label>
        <select
          className="form-select shadow-sm rounded-3"
          value={selectedPeriode}
          onChange={(e) => setSelectedPeriode(e.target.value)}
        >
          {periodes.map((p, idx) => (
            <option key={idx} value={p.periode}>
              {p.periode}
            </option>
          ))}
        </select>
      </div>

      {/* Ringkasan */}
      {summary && (
        <div className="row mb-4 g-3">
          {/* HQLA */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-3 d-flex flex-row align-items-center">
              <Banknote className="me-3 text-primary" size={28} />
              <div>
                <small className="text-muted">Total HQLA</small>
                <h5 className="fw-bold text-dark mb-0">{formatNumber(summary.jumlah_hqla)}</h5>
              </div>
            </div>
          </div>
          {/* Outflow */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-3 d-flex flex-row align-items-center">
              <TrendingDown className="me-3 text-danger" size={28} />
              <div>
                <small className="text-muted">Net Cash Outflow</small>
                <h5 className="fw-bold text-dark mb-0">{formatNumber(summary.jumlah_net_cash_outflow)}</h5>
              </div>
            </div>
          </div>
          {/* LCR */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-3 d-flex flex-row align-items-center">
              <TrendingUp
                className={`me-3 ${Number(summary.nilai_lcr) < 100 ? "text-danger" : "text-success"}`}
                size={28}
              />
              <div>
                <small className="text-muted">Nilai LCR</small>
                <h5
                  className={`fw-bold mb-0 ${Number(summary.nilai_lcr) < 100 ? "text-danger" : "text-success"}`}
                >
                  {Number(summary.nilai_lcr).toFixed(2)}%
                </h5>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="row g-4 mb-4 justify-content-center text-center">
  {/* Donut Chart */}
  {summary && (
    <div className="col-md-6 d-flex justify-content-center">
      <motion.div
        className="card shadow-lg border-0 rounded-4 p-3 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background: "linear-gradient(135deg, #f8f9fa, #eef2f7)"
        }}
      >
        <h4 className="fw-semibold mb-3">Komposisi HQLA vs NCF</h4>
        <PieChart width={320} height={320}>
          <Pie
            data={[
              { name: "HQLA", value: Number(summary.jumlah_hqla) },
              { name: "Net Cash Outflow", value: Number(summary.jumlah_net_cash_outflow) },
            ]}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            <Cell fill="url(#hqlagrad)" />
            <Cell fill="url(#ncfgrad)" />
          </Pie>
          <defs>
            <linearGradient id="hqlagrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06c9faff" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#1404f8ff" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="ncfgrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ee1014ff" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#f19393ff" stopOpacity={1} />
            </linearGradient>
          </defs>
          <Tooltip formatter={(v) => formatNumber(v)} />
          <Legend />
        </PieChart>
      </motion.div>
    </div>
  )}

{/* Gauge Chart */}
{summary && (
  <div className="col-md-6 d-flex justify-content-center">
    <motion.div
      className="card shadow-lg border-0 rounded-4 p-4 text-center"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
      style={{
        background: "linear-gradient(145deg, #ffffff, #f1f5f9)",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Judul */}
      <h4 className="fw-bold mb-4 text-success">
        Posisi LCR Saat Ini
      </h4>

      {/* Gauge Chart */}
      <RadialBarChart
        width={260}
        height={260}
        cx="50%"
        cy="50%"
        innerRadius="70%"
        outerRadius="100%"
        barSize={20}
        data={[{ name: "LCR", value: Number(summary.nilai_lcr) }]}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis type="number" domain={[0, 200]} tick={false} />
        <RadialBar
          minAngle={15}
          background
          clockWise
          dataKey="value"
          fill={
            Number(summary.nilai_lcr) < 100
              ? "url(#lowLCR)"
              : "url(#highLCR)"
          }
        />
        <defs>
          {/* Gradien hijau untuk LCR sehat */}
          <linearGradient id="highLCR" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2ecc71" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#a7f3d0" stopOpacity={1} />
          </linearGradient>
          {/* Gradien merah untuk LCR di bawah target */}
          <linearGradient id="lowLCR" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e74c3c" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#ffc1c1" stopOpacity={1} />
          </linearGradient>
        </defs>
      </RadialBarChart>

      {/* Nilai LCR */}
      <h2
        className={`fw-bolder mt-3 ${
          Number(summary.nilai_lcr) < 100 ? "text-danger" : "text-success"
        }`}
        style={{ fontSize: "2rem" }}
      >
        {Number(summary.nilai_lcr).toFixed(2)} %
      </h2>

      {/* Status teks */}
      <small
        className={`fw-semibold ${
          Number(summary.nilai_lcr) < 100 ? "text-danger" : "text-success"
        }`}
      >
        {Number(summary.nilai_lcr) < 100
          ? "Di Bawah Target Minimum (100%)"
          : "Memenuhi / Melebihi Target Minimum"}
      </small>
    </motion.div>
  </div>
)}

</div>

      {/* Bar Chart */}
    <div className="card shadow-sm border-0 rounded-4 p-3 mb-4">
      <h4 className="fw-semibold mb-3">Perbandingan HQLA & Outflow</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={trendData}
          margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="periode" />
          <YAxis tickFormatter={(v) => formatShortNumber(v)} />
          <Tooltip formatter={(v) => formatShortNumber(v)} />
          <Legend />
          <Bar
            dataKey="jumlah_hqla"
            fill="#4e79a7"
            name="HQLA"
            radius={[6, 6, 0, 0]}
            animationDuration={1500}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="jumlah_net_cash_outflow"
            fill="#e15759"
            name="Outflow"
            radius={[6, 6, 0, 0]}
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>

{/* Heatmap LCR dan Komponen */}
<div className="card shadow-sm border-0 rounded-4 p-3 mt-4">
  <h4 className="fw-semibold mb-3">Heatmap Komponen LCR per Periode</h4>
  <div style={{ height: 600 }}>
    <ResponsiveHeatMap
      data={[
        {
          id: "HQLA",
          data: trendData.map((d) => ({
            x: formatPeriodeToMonth(d.periode),
            y: d.jumlah_hqla || 0,
          })),
        },
        {
          id: "NCF",
          data: trendData.map((d) => ({
            x: formatPeriodeToMonth(d.periode),
            y: d.jumlah_net_cash_outflow || 0,
          })),
        },
        {
          id: "LCR",
          data: trendData.map((d) => ({
            x: formatPeriodeToMonth(d.periode),
            y: d.nilai_lcr || 0,
          })),
        },
      ]}
      margin={{ top: 35, right: 20, bottom: 60, left: 80 }}
      valueFormat={(v) => `${v.toFixed(2)}`}
      axisTop={{
        orient: "top",
        tickSize: 8,
        tickPadding: 8,
        tickRotation: -5,
      }}
      axisLeft={{
        tickSize: 10,
        tickPadding: 10,
        tickRotation: 0,
      }}
      colors={{
        type: "sequential",
        scheme: "red_yellow_green",
      }}
      emptyColor="#eeeeee"
      legends={[
        {
          anchor: "bottom",
          direction: "row",
          translateY: 40,
          length: 1100,
          thickness: 8,
          tickFormat: ">-.2f",
          title: "Nilai",
          titleAlign: "start",
          titleOffset: 4,
        },
      ]}
    />
  </div>
</div>

      {/* Line Chart Trend */}
<div className="card shadow-sm border-0 rounded-4 p-3">
  <h4 className="fw-semibold mb-3">LCR per Periode</h4>
  <ResponsiveContainer width="100%" height={400}>
    <LineChart 
      data={trendData}
      margin={{ top: 20, right: 80, left: 80, bottom: 60 }}>
      <CartesianGrid stroke="#f0f0f0" />

      <XAxis 
        dataKey="periode" 
        angle={-45}  // ✅ putar label X
        textAnchor="end"
        height={70}  // ✅ kasih ruang lebih di bawah
      />

      <YAxis 
        yAxisId="left" 
        tickFormatter={(value) =>
          value >= 1000000 ? `${value / 1000000}M` :
          value >= 1000 ? `${value / 1000}K` : value
        } 
      />

      <YAxis 
        yAxisId="right" 
        orientation="right"
        tickFormatter={(value) => `${value.toFixed(0)}%`} // ✅ format biar rapi
      />

      <Tooltip
        formatter={(value, name) => {
          if (name === "LCR (%)") return [`${value.toFixed(2)}%`, name];
          return [formatNumber(value), name];
        }}
      />

      <Legend />

      <Line 
        yAxisId="left" 
        type="monotone" 
        dataKey="jumlah_hqla" 
        stroke="#4e79a7" 
        strokeWidth={2} 
        name="HQLA" 
        dot={{ r: 3 }}
      />
      <Line 
        yAxisId="left" 
        type="monotone" 
        dataKey="jumlah_net_cash_outflow" 
        stroke="#e15759" 
        strokeWidth={2} 
        name="Outflow" 
        dot={{ r: 3 }}
      />
      <Line 
        yAxisId="right" 
        type="monotone" 
        dataKey="nilai_lcr" 
        stroke="#76b7b2" 
        strokeWidth={3} 
        dot={{ r: 4 }} 
        name="LCR (%)" 
      />
    </LineChart>
  </ResponsiveContainer>
</div>



    </div>
  );
}

export default Visualisasi;
