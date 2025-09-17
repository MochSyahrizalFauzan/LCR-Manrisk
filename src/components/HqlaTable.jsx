import React, { useMemo } from "react";
import Accordion from "react-bootstrap/Accordion";
import { usePeriod } from "../data/PeriodContext";

export default function HqlaTable({ dataByLevel, values, onChange, formatNum }) {
  const { periode, headerId } = usePeriod();

  // hitung nilai setelah haircut
  const computeAfter = (row) => {
    const raw = Number(values[row.id] || 0);
    const rate = row?.haircut_rate ? row.haircut_rate / 100 : 0;
    return raw > 0 ? formatNum(parseFloat((raw * (1 - rate)).toFixed(2))) : "-";

  };

  // hitung total otomatis per level dan grand total
  const totals = useMemo(() => {
    const result = {
      lvl1: { input: 0, after: 0 },
      lvl2a: { input: 0, after: 0 },
      lvl2b: { input: 0, after: 0 },
      grand: { input: 0, after: 0 },
    };

    ["lvl1", "lvl2a", "lvl2b"].forEach((lvl) => {
      dataByLevel[lvl]?.forEach((row) => {
        if (row.row_type === "subtotal" || row.row_type === "total") return;
        const num = Number(values[row.id] || 0);
        const after = parseFloat((num * (1 - (row.haircut_rate || 0) / 100)).toFixed(2));

        result[lvl].input += num;
        result[lvl].after += after;
      });
    });

    result.grand.input =
      result.lvl1.input + result.lvl2a.input + result.lvl2b.input;
    result.grand.after =
      result.lvl1.after + result.lvl2a.after + result.lvl2b.after;

    return result;
  }, [values, dataByLevel]);

  // render tabel per level
  const renderTable = (levelKey) => {
    const rows = [...(dataByLevel[levelKey] || [])].sort((a, b) => {
      if (a.row_type === "total") return 1;
      if (b.row_type === "total") return -1;
      if (a.row_type === "subtotal" && b.row_type !== "subtotal") return 1;
      if (b.row_type === "subtotal" && a.row_type !== "subtotal") return -1;
      return a.kode.localeCompare(b.kode, undefined, { numeric: true });
    });

    return (
      <div className="table-responsive">
        <table className="table table-bordered lcr-table mb-0">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Komponen</th>
              <th>Hair Cut</th>
              <th>Nilai (Rp.)</th>
              <th>Setelah Haircut</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (row.row_type === "subheader")
                return (
                  <tr key={row.id || i} className="table-light fw-bold">
                    <td className="text-center">{row.kode}</td>
                    <td colSpan="5">{row.nama_komponen}</td>
                  </tr>
                );

              if (row.row_type === "subtotal") {
                const subtotal = rows.reduce(
                  (acc, r) => {
                    if (r.row_type === "item") {
                      const val = Number(values[r.id] || 0);
                      acc.input += val;
                      acc.after += Math.round(
                        val * (1 - (r.haircut_rate || 0) / 100)
                      );
                    }
                    return acc;
                  },
                  { input: 0, after: 0 }
                );
                return (
                  <tr key={row.id || i} className="table-secondary fw-bold">
                    <td className="text-center">{row.kode}</td>
                    <td>{row.nama_komponen}</td>
                    <td></td>
                    <td className="text-end">{formatNum(subtotal.input)}</td>
                    <td className="text-end">{formatNum(subtotal.after)}</td>
                    <td></td>
                  </tr>
                );
              }

              if (row.row_type === "total")
                return (
                  <tr key={row.id || i} className="table-dark fw-bold">
                    <td className="text-center">{row.kode}</td>
                    <td>{row.nama_komponen}</td>
                    <td></td>
                    <td className="text-end">{formatNum(totals.grand.input)}</td>
                    <td className="text-end">{formatNum(totals.grand.after)}</td>
                    <td></td>
                  </tr>
                );

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
                      min="0"
                      onChange={(e) => onChange(row.id, e.target.value)}
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

  // simpan ke backend
  const handleSave = async () => {
  if (!periode || !headerId) {
    return alert("Header belum dibuat (periode & headerId wajib ada)");
  }

  const allRows = [
    ...(dataByLevel.lvl1 || []),
    ...(dataByLevel.lvl2a || []),
    ...(dataByLevel.lvl2b || []),
  ];

  const data = Object.entries(values).map(([id, val]) => {
    const master = allRows.find((m) => m.id === parseInt(id));
    const rate = master?.haircut_rate || 0;
    const nilai_awal = Number(val) || 0;
    return {
      hqla_master_id: parseInt(id),
      nilai_awal,
      nilai_setelah_haircut: Math.round(nilai_awal * (1 - rate / 100))
    };
  });

  if (!data.length) {
    return alert("Tidak ada data HQLA yang diisi");
  }

  const payload = {
    periode,
    lcr_header_id: headerId,
    data,
    user: "system",
  };

  console.log("Saving HQLA...", payload);

  try {
    const res = await fetch("http://localhost:5000/api/hqla_data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }

    const json = await res.json();
    console.log("HQLA save result:", json);
    alert("HQLA berhasil disimpan!");
  } catch (err) {
    console.error("Error save HQLA:", err);
    alert("Gagal simpan HQLA: " + err.message);
  }
};

  return (
    <>
      <Accordion defaultActiveKey="0" className="mb-3">
        <Accordion.Item eventKey="0">
          <Accordion.Header>Level 1</Accordion.Header>
          <Accordion.Body>{renderTable("lvl1")}</Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="1">
          <Accordion.Header>Level 2A</Accordion.Header>
          <Accordion.Body>{renderTable("lvl2a")}</Accordion.Body>
        </Accordion.Item>
        <Accordion.Item eventKey="2">
          <Accordion.Header>Level 2B</Accordion.Header>
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
            <div className="h4 mb-1">{formatNum(totals.grand.input)}</div>
            <div className="small text-muted">Total sebelum haircut</div>
          </div>
          <div className="text-end">
            <div className="h4 mb-1">{formatNum(totals.grand.after)}</div>
            <div className="small text-muted">Total setelah haircut</div>
          </div>
        </div>
        <div className="mt-3 text-end">
          <button className="btn btn-primary" onClick={handleSave}>
            Simpan HQLA
          </button>
        </div>
      </div>
    </>
  );
}
