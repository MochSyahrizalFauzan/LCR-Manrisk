import React, { useState } from "react";
import { usePeriod } from "../data/PeriodContext";
// import { upsertHeader } from "../data/api";
import axios from "axios";

export default function HeaderForm() {
  const { periode, setPeriode, setHeaderId } = usePeriod(); 
  const [namaBank, setNamaBank] = useState("BJB Syariah");
  const [userInput, setUserInput] = useState("admin");
  const [loading, setLoading] = useState(false);

const handleSave = async () => {
  if (!periode) return alert("Periode belum dipilih");

  const payload = {
    periode,
    nama_bank: namaBank,
    dibuat_oleh: userInput,
    };
    console.log("Payload yang dikirim:", payload);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/lcr_header", payload);
      console.log("Response dari server:", res.data);

      // Ambil data header dari response
      const header = res.data?.data;

      if (res.data?.ok && header?.id) {
        alert("Header berhasil disimpan");
        setPeriode(header.periode);
        setHeaderId(header.id);
      } else {
        // Jika server merespons tapi tidak ok
        alert("Gagal menyimpan header. Silakan cek kembali data.");
        console.error("Detail server:", res.data);
      }
    } catch (err) {
      // Jika request gagal (network / server error)
      console.error("Error saat request:", err);
      alert("Terjadi error saat menyimpan header");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-3 bg-white shadow-sm rounded mb-3">
      <div className="row g-2">
        <div className="col-md-4">
          <label className="form-label">Bank</label>
          <input
            className="form-control"
            value={namaBank}
            onChange={(e) => setNamaBank(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Periode</label>
          <input
            type="month"
            className="form-control"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">User</label>
          <input
            className="form-control"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button
            className="btn btn-primary w-100"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan Header"}
          </button>
        </div>
      </div>
    </div>
  );
}
