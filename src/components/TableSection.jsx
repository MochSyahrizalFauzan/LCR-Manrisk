import React from "react";

export default function TableSection({ rows, onChangeValue }) {
  return (
    <div className="table-responsive">
      <table className="table table-bordered">
        <thead>
          <tr>
            <th style={{ width: "4%" }}>No</th>
            <th>Komponen</th>
            <th style={{ width: "12%" }}>Haircut / Run-off Rate</th>
            <th style={{ width: "18%" }}>Nilai (Rp)</th>
            <th style={{ width: "18%" }}>Nilai Setelah Haircut (Rp)</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx}>
              <td className="readonly-cell">{r.no}</td>
              <td className="readonly-cell">{r.comp}</td>
              <td className="readonly-cell text-center">{r.haircut}%</td>
              <td className="text-end">
                <input
                  type="text"
                  className="editable-yellow"
                  placeholder="0"
                  value={r.value || ""}
                  onChange={(e) => onChangeValue(idx, e.target.value)}
                />
              </td>
              <td className="text-end fw-semibold">
                {r.afterValue > 0
                  ? r.afterValue.toLocaleString("id-ID")
                  : "-"}
              </td>
              <td>{r.note || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
