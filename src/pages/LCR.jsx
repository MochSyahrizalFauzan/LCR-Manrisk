import React, { useState, useMemo } from "react";
import Sidebar from "../components/sidebar";
import Accordion from "react-bootstrap/Accordion";
import "../style/LCR.css"; 
import "bootstrap/dist/css/bootstrap.min.css";
import { FaRegCalendarAlt } from "react-icons/fa";

// Data konstan
const DATA = {
  lvl1: [
    { no: '1.1', comp: 'Kas dan Setara Kas', haircut: 0, note: 'Posisi Kas' },
    { no: '1.2', comp: 'Total penempatan pada Bank Indonesia', haircut: 0, note: 'Total Penempatan pada Bank Indonesia (termasuk GWM Primer)' },
    { no: '1.2.1', comp: 'Bagian dari penempatan pada Bank Indonesia yang dapat ditarik saat kondisi stres', haircut: 0, note: '' },
    { no: '1.3', comp: 'Surat berharga yang memenuhi kriteria Pasal 10 ayat 1 huruf c :', haircut: 0, note: 'Total Surat Berharga Pemerintah, Sertifikat Bank Indonesia' },
    { no: '1.3.1', comp: 'Diterbitkan atau dijamin pemerintah negara lain', haircut: 0, note: 'Dinihilkan' },
    { no: '1.3.2', comp: 'Diterbitkan atau dijamin oleh bank sentral negara lain', haircut: 0, note: '' },
    { no: '1.3.3', comp: 'Diterbitkan atau dijamin oleh entitas sektor publik', haircut: 0, note: '' },
    { no: '1.3.4', comp: 'Diterbitkan atau dijamin oleh bank pembangunan multilateral', haircut: 0, note: '' },
    { no: '1.3.5', comp: 'Diterbitkan atau dijamin oleh lembaga internasional (a.l BIS, IMF, ECB and European Community)', haircut: 0, note: '' },
    { no: '1.4', comp: 'Surat berharga yang diterbitkan Pemerintah Pusat dan Bank Indonesia dalam rupiah dan valuta asing', haircut: 0, note: 'Total Surat Berharga Pemerintah, Sertifikat Bank Indonesia dalam denom Rupiah dan Valuta Asing' },
    { no: '1.5', comp: 'Surat berharga yang diterbitkan oleh pemerintah dan bank sentral negara lain dalam valuta asing dengan bobot risiko lebih dari 0% yang memenuhi kriteria Pasal 10 ayat (1) huruf e', haircut: 0, note: 'DInihilkan' },
  ],
  lvl2a: [
    { no: '2.1', comp: 'Surat berharga yang memenuhi kriteria Pasal 11 ayat (1) huruf a :', haircut: 15, note: 'Dininilkan sesuai kriteria' },
    { no: '2.1.1', comp: 'Diterbitkan atau dijamin pemerintah negara lain', haircut: 15, note: 'Dininilkan sesuai kriteria' },
    { no: '2.1.2', comp: 'Diterbitkan atau dijamin oleh bank sentral negara lain', haircut: 15, note: '' },
    { no: '2.1.3', comp: 'Diterbitkan atau dijamin oleh entitas sektor publik', haircut: 15, note: '' },
    { no: '2.1.4', comp: 'Diterbitkan atau dijamin oleh bank pembangunan multilateral', haircut: 15, note: '' },
    { no: '2.2', comp: 'Surat berharga berupa surat utang yang diterbitkan oleh korporasi non-keuangan yang memenuhi kriteria Pasal 11 ayat (1) huruf b', haircut: 15, note: 'Surat Berharga Korporasi Bukan Lembaga Keuangan' },
    { no: '2.3', comp: 'Surat berharga berbentuk covered bonds yang tidak diterbitkan oleh Bank pelapor atau pihak yang terafiliasi dengan Bank pelapor yang memenuhi kriteria Pasal 11 ayat (1) huruf b', haircut: 15, note: '' },
  ],
  lvl2b: [
    { no: '3.1', comp: 'Efek beragun aset (EBA) berupa rumah tinggal yang memenuhi kriteria Pasal 12 ayat (1) huruf a', haircut: 25, note: 'Efek beragun aset dengan rating minimal AA' },
    { no: '3.2', comp: 'Surat berharga berupa surat utang yang diterbitkan oleh korporasi yang memenuhi kriteria Pasal 12 ayat (1) huruf b', haircut: 50, note: 'Surat Berharga Korporasi Bukan Lembaga Keuangan dengan rating obligasi minimal BBB- sd A+' },
    { no: '3.3', comp: 'Saham biasa yang dimiliki perusahaan anak bukan Bank yang memenuhi kriteria Pasal 12 ayat (1) huruf c', haircut: 50, note: 'Dinihilkan' },
    { no: '3.4', comp: 'Surat berharga pemerintah atau bank sentral negara lain dengan peringkat paling tinggi BBB+ dan paling rendah BBB-', haircut: 50, note: 'Dinihilkan' },
  ]
};

// Helper format rupiah
function formatNum(n) {
  if (!n || isNaN(n)) return "-";
  return new Intl.NumberFormat("id-ID").format(n);
}

export default function LCR() {
  const [values, setValues] = useState(() => {
    const map = {};
    Object.keys(DATA).forEach((level) =>
      DATA[level].forEach((_, idx) => (map[`${level}-${idx}`] = ""))
    );
    return map;
  });

  function handleChange(id, val) {
    const cleaned = String(val).replace(/[^\d]/g, "");
    setValues((prev) => ({ ...prev, [id]: cleaned }));
  }

  function computeAfter(id) {
    const raw = parseInt(values[id] || "0", 10) || 0;
    const [lvl, idx] = id.split("-");
    const cfg = DATA[lvl][parseInt(idx, 10)];
    const haircutRate = cfg.haircut / 100;
    return raw ? formatNum(Math.round(raw * (1 - haircutRate))) : "-";
  }

  const totals = useMemo(() => {
    const result = {
      lvl1: { input: 0, after: 0 },
      lvl2a: { input: 0, after: 0 },
      lvl2b: { input: 0, after: 0 },
      grand: { input: 0, after: 0 }
    };

    Object.entries(values).forEach(([id, raw]) => {
      const num = parseInt(raw || "0", 10) || 0;
      const [lvl, idx] = id.split("-");
      const cfg = DATA[lvl][parseInt(idx, 10)];
      const after = Math.round(num * (1 - cfg.haircut / 100));
      result[lvl].input += num;
      result[lvl].after += after;
    });

    // Hitung grand total
    result.grand.input = result.lvl1.input + result.lvl2a.input + result.lvl2b.input;
    result.grand.after = result.lvl1.after + result.lvl2a.after + result.lvl2b.after;

    return result;
  }, [values]);

  function renderTable(levelKey) {
    return (
      <div className="table-responsive">
        <table className="table table-bordered lcr-table mb-0">
          <thead>
            <tr>
              <th>No</th>
              <th>Komponen</th>
              <th>Hair Cut</th>
              <th>Nilai (Rp.)</th>
              <th>Nilai Setelah Haircut (Rp.)</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {DATA[levelKey].map((row, i) => {
              const id = `${levelKey}-${i}`;
              return (
                <tr key={id}>
                  <td>{row.no}</td>
                  <td>{row.comp}</td>
                  <td className="text-center">{row.haircut}%</td>
                  <td>
                    <input
                      type="number"
                      className="form-control text-end"
                      value={values[id]}
                      onChange={(e) => handleChange(id, e.target.value)}
                    />
                  </td>
                  <td className="text-end">{computeAfter(id)}</td>
                  <td>{row.note}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="totalrow">
              <td colSpan="3" className="text-end fw-bold">
                Jumlah HQLA {levelKey.toUpperCase()}
              </td>
              <td className="text-end fw-bold">{formatNum(totals[levelKey].input)}</td>
              <td className="text-end fw-bold">{formatNum(totals[levelKey].after)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="main-content p-4">
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

        {/* Accordion Tables */}
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

        <div className="card mb-4 mt-4 shadow-sm grand-totals-card" style={{ backgroundColor: "#fff" }}>
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <strong>Total HQLA Sebelum Penyesuaian</strong>
              <div className="small text-muted">Jumlah seluruh nilai sebelum haircut</div>
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

      </div>
    </div>
  );
}
