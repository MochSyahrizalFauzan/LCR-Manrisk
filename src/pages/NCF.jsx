import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../style/Dashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaRegCalendarAlt } from "react-icons/fa";
import { Accordion } from "react-bootstrap";

export default function NCF() {
  const [data, setData] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/NCF.json")
      .then((res) => res.json())
      .then((json) => {
        // Bersihkan haircut dan nilai
        const cleanedData = {};
        Object.keys(json["B. Net Cash Outflow (Arus Kas Keluar Bersih)"]).forEach(
          (sectionName) => {
            const section = json["B. Net Cash Outflow (Arus Kas Keluar Bersih)"][sectionName];
            cleanedData[sectionName] = {};
            Object.keys(section).forEach((key) => {
              const item = section[key];
              if (item.detail) {
                cleanedData[sectionName][key] = item.detail.map((row) => {
                  const haircutNum = parseFloat(String(row.haircut).replace("%", "")) || 0;
                  const nilaiNum = row.nilai === "-" ? 0 : parseFloat(row.nilai);
                  return {
                    ...row,
                    haircut: haircutNum,
                    nilai: nilaiNum,
                    nilai_setelah_haircut: nilaiNum * (1 - haircutNum / 100),
                  };
                });
              }
            });
          }
        );
        setData(cleanedData);
        setLoaded(true);
      })
      .catch((err) => console.error(err));
  }, []);

  const formatNum = (n) => {
    if (n === null || n === undefined || isNaN(n)) return "-";
    return new Intl.NumberFormat("id-ID").format(n);
  };

  const handleNilaiChange = (sectionName, key, index, value) => {
    const updatedData = { ...data };
    const nilaiBaru = parseFloat(value) || 0;
    const haircutPersen = updatedData[sectionName][key][index].haircut || 0;
    updatedData[sectionName][key][index].nilai = nilaiBaru;
    updatedData[sectionName][key][index].nilai_setelah_haircut =
      nilaiBaru * (1 - haircutPersen / 100);
    setData(updatedData);
  };

  const renderTable = (sectionName, key) => {
    const rows = data[sectionName][key];
    if (!rows || rows.length === 0) return <p className="text-center">Tidak ada data</p>;

    return (
      <div className="table-responsive">
        <table className="table table-bordered lcr-table mb-0">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Komponen</th>
              <th>Haircut (%)</th>
              <th>Nilai (Rp.)</th>
              <th>Nilai Setelah Haircut (Rp.)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>{`${key}.${i + 1}`}</td>
                <td>{row.komponen}</td>
                <td>{row.haircut}</td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={row.nilai}
                    onChange={(e) =>
                      handleNilaiChange(sectionName, key, i, e.target.value)
                    }
                  />
                </td>
                <td>{formatNum(row.nilai_setelah_haircut)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!loaded) return <p>Memuat data...</p>;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <div className="lcr-header d-flex justify-content-between align-items-center mb-4 p-3 shadow-sm rounded bg-white">
          <h3 className="m-0 fw-bold">LCR BJB Syariah</h3>
          <div className="periode d-flex align-items-center gap-2">
            <label className="fw-bold mb-0">Periode </label>
            <div className="input-group input-group-sm custom-month-picker">
              <input type="month" className="form-control" />
              <span className="input-group-text">
                <FaRegCalendarAlt />
              </span>
            </div>
          </div>
        </div>

        <Accordion defaultActiveKey={["0"]} alwaysOpen>
          {Object.keys(data).map((sectionName, i) => (
            <Accordion.Item key={i} eventKey={String(i)}>
              <Accordion.Header>{sectionName}</Accordion.Header>
              <Accordion.Body>
                {Object.keys(data[sectionName]).map((key) => renderTable(sectionName, key))}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
