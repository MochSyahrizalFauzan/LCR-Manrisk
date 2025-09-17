import React, { useMemo } from "react";
import Accordion from "react-bootstrap/Accordion";

export default function NcfTable({
  masterGrouped,
  values,
  onChange,
  onSave,
  formatNum,
}) {
  // Hitung nilai terhitung = nilai_awal * (persentase/100)
  const calc = (row) => {
    const raw = Number(values[row.id] || 0);
    const pct = row?.haircut_rate ? row.haircut_rate / 100 : 0;
    return raw > 0 ? parseFloat((raw * pct).toFixed(2)) : 0;
  };

  // Hitung total outflow, inflow, dan net
  const totals = useMemo(() => {
    const sum = { outflow: 0, inflow: 0, net: 0 };

    (masterGrouped.outflow || []).forEach((r) => {
      sum.outflow += calc(r);
    });
    (masterGrouped.inflow || []).forEach((r) => {
      sum.inflow += calc(r);
    });

    const inflowUsed = Math.min(sum.inflow, 0.75 * sum.outflow);
    sum.net = parseFloat((sum.outflow - inflowUsed).toFixed(2));

    // bulatkan 2 desimal juga
    sum.outflow = parseFloat(sum.outflow.toFixed(2));
    sum.inflow = parseFloat(sum.inflow.toFixed(2));

    return sum;
  }, [values, masterGrouped]);

  // Fungsi render table
  const renderNCFTable = (levelKey) => {
    const rows = [...(masterGrouped[levelKey] || [])].sort((a, b) => {
      if (a.row_type === "total") return 1;
      if (b.row_type === "total") return -1;
      return (a.id || 0) - (b.id || 0); // urut sesuai id
    });

    const grand = rows.reduce(
      (acc, r) => {
        if (r.row_type === "item") {
          const val = Number(values[r.id] || 0);
          acc.input += val;
          acc.after += calc(r);
        }
        return acc;
      },
      { input: 0, after: 0 }
    );

    // bulatkan 2 desimal
    grand.input = parseFloat(grand.input.toFixed(2));
    grand.after = parseFloat(grand.after.toFixed(2));

    return (
      <div className="table-responsive">
        <table className="table table-bordered lcr-table mb-0">
          <thead>
            <tr>
              <th>Kode</th>
              <th>Komponen</th>
              <th>Hair Cut</th>
              <th>Nilai (Rp.)</th>
              <th>Nilai Terhitung</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              if (row.row_type === "subheader") {
                return (
                  <tr key={row.id || i} className="table-light fw-bold">
                    <td className="text-center">{row.kode}</td>
                    <td colSpan="5">{row.nama_komponen}</td>
                  </tr>
                );
              }

              if (row.row_type === "subtotal") {
                const subtotal = rows.reduce(
                  (acc, r) => {
                    if (r.row_type === "item") {
                      const val = Number(values[r.id] || 0);
                      acc.input += val;
                      acc.after += calc(r);
                    }
                    return acc;
                  },
                  { input: 0, after: 0 }
                );

                subtotal.input = parseFloat(subtotal.input.toFixed(2));
                subtotal.after = parseFloat(subtotal.after.toFixed(2));

                return (
                  <tr key={row.id || i} className="table-secondary fw-bold">
                    <td className="text-center">{row.kode}</td>
                    <td colSpan="2">{row.nama_komponen}</td>
                    <td className="text-end">{formatNum(subtotal.input)}</td>
                    <td className="text-end">{formatNum(subtotal.after)}</td>
                    <td></td>
                  </tr>
                );
              }

              if (row.row_type === "total") {
                return (
                  <tr key={row.id || i} className="table-dark fw-bold">
                    <td className="text-center">{row.kode}</td>
                    <td>{row.nama_komponen}</td>
                    <td></td>
                    <td className="text-end">{formatNum(grand.input)}</td>
                    <td className="text-end">{formatNum(grand.after)}</td>
                    <td></td>
                  </tr>
                );
              }

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
                  <td className="text-end">{formatNum(calc(row))}</td>
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
    <>
      <div className="accordion" id="accordionNCF">
        {/* Outflow */}
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingOutflow">
            <button
              className="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseOutflow"
              aria-expanded="true"
              aria-controls="collapseOutflow"
            >
              NCF Outflow
            </button>
          </h2>
          <div
            id="collapseOutflow"
            className="accordion-collapse collapse show"
            aria-labelledby="headingOutflow"
            data-bs-parent="#accordionNCF"
          >
            <div className="accordion-body">{renderNCFTable("outflow")}</div>
          </div>
        </div>

        {/* Inflow */}
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingInflow">
            <button
              className="accordion-button collapsed"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseInflow"
              aria-expanded="false"
              aria-controls="collapseInflow"
            >
              NCF Inflow
            </button>
          </h2>
          <div
            id="collapseInflow"
            className="accordion-collapse collapse"
            aria-labelledby="headingInflow"
            data-bs-parent="#accordionNCF"
          >
            <div className="accordion-body">{renderNCFTable("inflow")}</div>
          </div>
        </div>
      </div>

      {/* Grand Total */}
      <div className="mt-3 p-3 bg-white rounded shadow-sm">
        <h5 className="fw-bold">Grand Total NCF (Preview)</h5>
        <div className="d-flex justify-content-between">
          <div>Total Outflow:</div>
          <div>{formatNum(totals.outflow)}</div>
        </div>
        <div className="d-flex justify-content-between">
          <div>Total Inflow:</div>
          <div>{formatNum(totals.inflow)}</div>
        </div>
        <div className="small text-muted mt-1">
          Inflow dipakai maksimal 75% dari Outflow
        </div>
        <hr />
        <div className="d-flex justify-content-between fw-bold">
          <div>Net Cash Outflow (preview):</div>
          <div>{formatNum(totals.net)}</div>
        </div>

        <div className="mt-3 text-end">
          <button className="btn btn-primary" onClick={onSave}>
            Simpan NCF
          </button>
        </div>
      </div>
    </>
  );
}
