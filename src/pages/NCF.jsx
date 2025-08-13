import React, { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import "../style/Dashboard.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaRegCalendarAlt } from "react-icons/fa";
import { Accordion } from "react-bootstrap";

export default function NCF() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("/NCF.json")
      .then((res) => res.json())
      .then((json) => {
        console.log("JSON loaded:", json);
        const arusKasKeluar =
          json["B. Net Cash Outflow (Arus Kas Keluar Bersih)"][
            "1. Arus Kas Keluar"
          ];

        let allRows = [];
        Object.keys(arusKasKeluar).forEach((key) => {
          const section = arusKasKeluar[key];
          if (section.detail) {
            section.detail.forEach((item, index) => {
              allRows.push({
                parent: key,
                kode: `${key}.${index + 1}`,
                komponen: item.komponen,
                haircut: item.haircut || 0,
                nilai: item.nilai || 0,
                nilai_setelah_haircut:
                  item.nilai_setelah_haircut || 0,
              });
            });
          }
        });

        setData(allRows);
      });
  }, []);

  const formatNum = (n) => {
    if (n === null || n === undefined || isNaN(n)) return "-";
    return new Intl.NumberFormat("id-ID").format(n);
  };

  const handleNilaiChange = (index, value) => {
    const updatedData = [...data];
    const nilaiBaru = parseFloat(value) || 0;
    const haircutPersen = parseFloat(updatedData[index].haircut) || 0;

    updatedData[index].nilai = nilaiBaru;
    updatedData[index].nilai_setelah_haircut =
      nilaiBaru * (1 - haircutPersen / 100);

    setData(updatedData);
  };

  // Fungsi render tabel berdasarkan kategori
  const renderTable = (parentKey) => {
    const filteredRows = data.filter((row) => row.parent === parentKey);
    if (filteredRows.length === 0) {
      return <p className="text-center mb-0">Tidak ada data</p>;
    }

    return (
      <div className="table-responsive">
        <table className="table table-bordered lcr-table mb-0">
          <thead>
            <tr>
              <th>Kode</th>
              <th style={{ width: "25%" }}>Komponen</th>
              <th>Haircut (%)</th>
              <th>Nilai (Rp.)</th>
              <th>Nilai Setelah Haircut (Rp.)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, index) => (
              <tr key={index}>
                <td>{row.kode}</td>
                <td>{row.komponen}</td>
                <td>{row.haircut}</td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={row.nilai}
                    onChange={(e) =>
                      handleNilaiChange(
                        data.indexOf(row),
                        e.target.value
                      )
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
          <Accordion.Item eventKey="0">
            <Accordion.Header>1. Arus Kas Keluar</Accordion.Header>
            <Accordion.Body>{renderTable("lvl1")}</Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header>2. Arus Kas Masuk</Accordion.Header>
            <Accordion.Body>{renderTable("lvl2")}</Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  );
}
