// src/pages/NCF.jsx
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import "../style/Dashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Accordion } from "react-bootstrap";

export default function NCF() {
  const [data, setData] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/Data/NCF.json")
      .then((res) => res.json())
      .then((json) => {
        const cleanedData = {};
        Object.keys(json["B. Net Cash Outflow (Arus Kas Keluar Bersih)"]).forEach(
          (sectionName) => {
            const section =
              json["B. Net Cash Outflow (Arus Kas Keluar Bersih)"][sectionName];
            cleanedData[sectionName] = {};
            Object.keys(section).forEach((key) => {
              const item = section[key];
              if (item.detail) {
                cleanedData[sectionName][key] = item.detail.map((row) => {
                  const haircutNum =
                    parseFloat(String(row.haircut).replace("%", "")) || 0;
                  const nilaiNum =
                    row.nilai === "-" ? 0 : parseFloat(row.nilai);
                  return {
                    ...row,
                    haircut: haircutNum,
                    nilai: nilaiNum,
                    nilai_setelah_haircut:
                      nilaiNum * (1 - haircutNum / 100),
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
    if (!rows || rows.length === 0)
      return <p className="text-center">Tidak ada data</p>;

    return (
      <div className="table-responsive mb-3">
        <table className="table table-bordered lcr-table mb-0">
          <thead>
            <tr>
              <th>No</th>
              <th>Komponen</th>
              <th>Haircut (%)</th>
              <th>Nilai (Rp.)</th>
              <th>Nilai Setelah Haircut (Rp.)</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isSubtotal =
                String(row.komponen || "")
                  .toLowerCase()
                  .includes("subtotal") ||
                String(row.kode || "").toLowerCase().includes("subtotal");

              return (
                <tr
                  className={isSubtotal ? "subtotal" : ""}
                  key={i}
                  style={
                    isSubtotal
                      ? { fontWeight: "bold", backgroundColor: "#5e5d5dff" }
                      : {}
                  }
                >
                  {isSubtotal ? (
                    <>
                      <td colSpan={3}>{row.komponen}</td>
                      <td>{formatNum(row.nilai)}</td>
                      <td>{formatNum(row.nilai_setelah_haircut)}</td>
                      <td>{row.keterangan || "-"}</td>
                    </>
                  ) : (
                    <>
                      <td>{`${key}.${i + 1}`}</td>
                      <td>{row.komponen}</td>
                      <td>{row.haircut}</td>
                      <td>
                        <input
                          type="number"
                          className="lcr-input-nilai"
                          value={row.nilai}
                          onChange={(e) =>
                            handleNilaiChange(sectionName, key, i, e.target.value)
                          }
                        />
                      </td>
                      <td>{formatNum(row.nilai_setelah_haircut)}</td>
                      <td>{row.keterangan || "-"}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (!loaded) return <p className="text-center mt-4">Memuat data...</p>;

  return (
    <>
      {/* <Navbar /> */}
      <div className="dashboard-container">
        <div className="main-content">
          <h3 className="fw-bold mb-4">Net Cash Outflow (NCF)</h3>

          <Accordion defaultActiveKey={["0"]} alwaysOpen>
            {Object.keys(data).map((sectionName, i) => (
              <Accordion.Item key={i} eventKey={String(i)}>
                <Accordion.Header>{sectionName}</Accordion.Header>
                <Accordion.Body>
                  {Object.keys(data[sectionName]).map((key, idx) => (
                    <div key={idx}>{renderTable(sectionName, key)}</div>
                  ))}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </>
  );
}
