// src/pages/LCR.jsx
import React, { useState, useMemo, useEffect } from "react";
import { usePeriod } from "../data/PeriodContext";
import Accordion from "react-bootstrap/Accordion";
import "../style/LCR.css";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const formatNum = (n) => {
  if (!n || isNaN(n)) return "-";
  return new Intl.NumberFormat("id-ID").format(n);
};

export default function LCR() {
  const { month } = usePeriod();
  const [DATA, setDATA] = useState({ lvl1: [], lvl2a: [], lvl2b: [] });
  const [values, setValues] = useState({});

// Load master data
useEffect(() => {
  axios.get("http://localhost:5000/hqla_master")
    .then((res) => {
      const grouped = { lvl1: [], lvl2a: [], lvl2b: [] };
      res.data.forEach((row) => {
        if (row.level === "Level 1") grouped.lvl1.push(row);
        if (row.level === "Level 2A") grouped.lvl2a.push(row);
        if (row.level === "Level 2B") grouped.lvl2b.push(row);
      });
      setDATA(grouped);

      const initialValues = {};
      Object.keys(grouped).forEach((level) =>
        grouped[level].forEach((row) => {
          initialValues[row.id] = "";
        })
      );
      setValues(initialValues);
    })
    .catch((err) => console.error("Error loading master:", err));
}, []);

// Load existing data by periode
useEffect(() => {
  if (!month) return;
  if (!DATA.lvl1.length && !DATA.lvl2a.length && !DATA.lvl2b.length) return;

  axios.get(`http://localhost:5000/api/lcr_header/${month}`)
    .then((res) => {
      console.log("DEBUG existing response:", res.data);

      const rows = res.data?.data || [];
      if (!rows.length) {
        setValues({});  
        return;
      }

      const existingValues = {};
      rows.forEach((row) => {
        existingValues[row.hqla_master_id] = row.nilai_awal;
      });

      setValues(existingValues); 
      console.log("SET VALUES:", existingValues);
    })
    .catch((err) => console.error("Error loading existing data:", err));
}, [month, DATA.lvl1.length, DATA.lvl2a.length, DATA.lvl2b.length]);

// handleChange → pakai hqla_master_id sebagai key
const handleChange = (masterId, val) => {
  const cleaned = String(val).replace(/[^\d]/g, "");
  setValues((prev) => ({ ...prev, [masterId]: cleaned }));
};

// Hitung nilai setelah haircut
const computeAfter = (row) => {
  const raw = Number(values[row.id] || 0);
  const haircutRate = row?.haircut_rate ? row.haircut_rate / 100 : 0;
  return raw > 0 ? formatNum(Math.round(raw * (1 - haircutRate))) : "-";
};

// Hitung total
const totals = useMemo(() => {
  const result = {
    lvl1: { input: 0, after: 0 },
    lvl2a: { input: 0, after: 0 },
    lvl2b: { input: 0, after: 0 },
    grand: { input: 0, after: 0 },
  };

  ["lvl1", "lvl2a", "lvl2b"].forEach((lvl) => {
    DATA[lvl]?.forEach((row) => {
      if (row.row_type === "subtotal" || row.row_type === "total") return;
      const num = Number(values[row.id] || 0);
      const after = Math.round(num * (1 - (row.haircut_rate || 0) / 100));
      result[lvl].input += num;
      result[lvl].after += after;
    });
  });

  result.grand.input =
    result.lvl1.input + result.lvl2a.input + result.lvl2b.input;
  result.grand.after =
    result.lvl1.after + result.lvl2a.after + result.lvl2b.after;

  return result;
}, [values, DATA]);


// Simpan ke backend
// Simpan ke backend
const handleSave = async () => {
  if (!month) {
    alert("Periode harus diisi sebelum menyimpan data!");
    return;
  }

  const periodeParam = /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : month;

  let preparedData = [];
  ["lvl1", "lvl2a", "lvl2b"].forEach((level) => {
    DATA[level]?.forEach((row) => {
      if (row.row_type === "subtotal" || row.row_type === "total") return;

      const nilaiAwal = Number(values[row.id] || 0);
      const nilaiAfter = Math.round(
        nilaiAwal * (1 - (row.haircut_rate || 0) / 100)
      );

      preparedData.push({
        hqla_master_id: row.id,
        nilai_awal: isNaN(nilaiAwal) ? 0 : nilaiAwal,
        nilai_setelah_haircut: isNaN(nilaiAfter) ? 0 : nilaiAfter,
      });
    });
  });

  // Buang duplikat berdasarkan hqla_master_id
  preparedData = preparedData.reduce((acc, curr) => {
    if (!acc.some(item => item.hqla_master_id === curr.hqla_master_id)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  try {
    const saveRes = await fetch("http://localhost:5000/api/hqla_data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periode: periodeParam,
        data: preparedData,
      }),
    });

    if (saveRes.ok) {
      alert("Data berhasil disimpan!");
    } else {
      const errData = await saveRes.json();
      alert("Gagal menyimpan data: " + (errData?.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Error saat menyimpan:", err);
    alert("Terjadi error saat menyimpan data.");
  }
};



const renderTable = (levelKey) => {
  // Ambil data dari props/DB
  let rows = [...(DATA[levelKey] || [])];

  // Urutkan: semua row normal/subheader/subtotal sesuai kode, total selalu terakhir
  rows.sort((a, b) => {
    if (a.row_type === "total") return 1;
    if (b.row_type === "total") return -1;
    if (a.row_type === "subtotal" && b.row_type !== "subtotal") return 1;
    if (b.row_type === "subtotal" && a.row_type !== "subtotal") return -1;
    return a.kode.localeCompare(b.kode, undefined, { numeric: true });
  });

  // Hitung subtotal untuk 1 level
  const computeSubtotal = (rows) => {
    let subtotalInput = 0;
    let subtotalAfter = 0;
    rows.forEach((row) => {
      if (row.row_type === "item") {
        const val = parseFloat(values[row.id] || 0);
        subtotalInput += val;
        subtotalAfter += val * (1 - (row.haircut_rate || 0) / 100);
      }
    });
    return { input: subtotalInput, after: subtotalAfter };
  };

  // Hitung grand total seluruh level
  const computeGrandTotal = () => {
    let totalInput = 0;
    let totalAfter = 0;
    Object.values(DATA).forEach((levelRows) => {
      levelRows.forEach((row) => {
        if (row.row_type === "item") {
          const val = parseFloat(values[row.id] || 0);
          totalInput += val;
          totalAfter += val * (1 - (row.haircut_rate || 0) / 100);
        }
      });
    });
    return { input: totalInput, after: totalAfter };
  };

  return (
    <div className="table-responsive">
      <table className="table table-bordered lcr-table mb-0">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Komponen</th>
            <th>Hair Cut</th>
            <th>Nilai (Rp.)</th>
            <th>Nilai Setelah Haircut (Rp.)</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const id = `${levelKey}-${i}`;

            // === Subheader ===
            if (row.row_type === "subheader") {
              return (
                <tr key={id} className="table-light fw-bold">
                  <td className="text-center">{row.kode}</td>
                  <td colSpan="5">{row.nama_komponen}</td>
                </tr>
              );
            }

            // === Subtotal ===
            if (row.row_type === "subtotal") {
              const subtotal = computeSubtotal(rows);
              return (
                <tr key={id} className="table-secondary fw-bold">
                  <td className="text-center">{row.kode}</td>
                  <td>{row.nama_komponen}</td>
                  <td></td>
                  <td className="text-end">{formatNum(subtotal.input)}</td>
                  <td className="text-end">{formatNum(subtotal.after)}</td>
                  <td></td>
                </tr>
              );
            }

            // === Total ===
            if (row.row_type === "total") {
              const grand = computeGrandTotal();
              return (
                <tr key={id} className="table-dark fw-bold">
                  <td className="text-center">{row.kode}</td>
                  <td>{row.nama_komponen}</td>
                  <td></td>
                  <td className="text-end">{formatNum(grand.input)}</td>
                  <td className="text-end">{formatNum(grand.after)}</td>
                  <td></td>
                </tr>
              );
            }

            // === Default item ===
            return (
              <tr key={row.id}>
                <td className="text-center">{row.kode}</td>
                <td>{row.nama_komponen}</td>
                <td className="text-center">{row.haircut_rate}%</td>
                <td>
                  <input
                    type="number"
                    className="form-control text-end"
                    value={values[row.id] ?? ""}
                    onChange={(e) => handleChange(row.id, e.target.value)}
                    min="0"
                  />
                </td>
                <td className="text-end">{computeAfter(row)}</td>
                <td>{row.keterangan}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};



  return (
    <div className="dashboard">
      <div className="main-content p-4">
        <div className="lcr-header d-flex justify-content-between align-items-center mb-4 p-3 shadow-sm rounded bg-white">
          <h3 className="m-0 fw-bold">LCR BJB Syariah</h3>
          <span className="text-muted">Periode: {month}</span>
        </div>

        <Accordion defaultActiveKey={["0", "1", "2"]} alwaysOpen>
          <Accordion.Item eventKey="0">
            <Accordion.Header>HQLA Level 1</Accordion.Header>
            <Accordion.Body>{renderTable("lvl1")}</Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>HQLA Level 2A</Accordion.Header>
            <Accordion.Body>{renderTable("lvl2a")}</Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>HQLA Level 2B</Accordion.Header>
            <Accordion.Body>{renderTable("lvl2b")}</Accordion.Body>
          </Accordion.Item>
        </Accordion>

        <div className="grand-totals-card mt-4 p-3 shadow-sm rounded bg-white">
          <div className="d-flex w-100 justify-content-between align-items-center">
            <div>
              <strong>Total HQLA Sebelum Penyesuaian</strong>
              <div className="small text-muted">
                Jumlah seluruh nilai sebelum haircut
              </div>
            </div>
            <div className="text-end">
              <div id="grand-total-input" className="h4 mb-1">
                {formatNum(totals.grand.input)}
              </div>
              <div className="small text-muted">Total Nilai sebelum haircut</div>
            </div>
            <div className="text-end">
              <div id="grand-total-after" className="h4 mb-1">
                {formatNum(totals.grand.after)}
              </div>
              <div className="small text-muted">Total Nilai setelah haircut</div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-end">
          <button className="btn btn-primary" onClick={handleSave}>
            Simpan Data
          </button>
        </div>
      </div>
    </div>
  );
}
