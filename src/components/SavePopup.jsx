// src/components/SavePopup.jsx
import React, { useState, useMemo, useEffect } from "react";
import { usePeriod } from "../data/PeriodContext";
import "../style/App.css";

export default function SavePopup({ show, namaBank, setNamaBank, dibuatOleh, setDibuatOleh, onClose, onSave }) {
  if (!show) return null; // kalau show=false, tidak render

  return (
    <div className="modal-backdrop show d-flex align-items-center justify-content-center">
      <div className="modal-dialog shadow-lg rounded bg-white p-4" style={{ minWidth: "400px" }}>
        <h5 className="mb-3">Lengkapi Data Laporan</h5>

        <div className="mb-3">
          <label className="form-label">Nama Bank</label>
          <input
            type="text"
            className="form-control"
            value={namaBank}
            onChange={(e) => setNamaBank(e.target.value)}
            placeholder="Masukkan nama bank"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Dibuat Oleh</label>
          <input
            type="text"
            className="form-control"
            value={dibuatOleh}
            onChange={(e) => setDibuatOleh(e.target.value)}
            placeholder="Masukkan nama pembuat"
          />
        </div>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <button className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
