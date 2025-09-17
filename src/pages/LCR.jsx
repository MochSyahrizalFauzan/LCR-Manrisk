// src/pages/LCR.jsx
import React, { useEffect, useState } from "react";
import { usePeriod } from "../data/PeriodContext";
import axios from "axios";
import HeaderForm from "../components/HeaderForm";
import HqlaTable from "../components/HqlaTable";
import NcfTable from "../components/NcfTable";

const formatNum = (n) => {
  if ((!n && n !== 0) || isNaN(n)) return "-";

  // ubah ke jutaan
  const inMillions = n / 100;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(inMillions);
};

export default function LCR() {
  const { periode, headerId } = usePeriod();
  // master
  const [HQLA, setHQLA] = useState({ lvl1: [], lvl2a: [], lvl2b: [] });
  const [NCF, setNCF] = useState({ outflow: [], inflow: [] });
  // values per periode
  const [hqlaValues, setHqlaValues] = useState({});
  const [ncfValues, setNcfValues] = useState({});
  // summary
  const [summary, setSummary] = useState(null);

  // Fungsi untuk mengurutkan data dan menaruh subtotal/total di bawah
  const sortWithSubtotal = (list) => {
    const items = list.filter(
      (r) => r.row_type !== "subtotal" && r.row_type !== "total");
    const totals = list.filter(
      (r) => r.row_type === "subtotal" || r.row_type === "total");
    return [
      ...items.sort((a, b) => a.id - b.id),
      ...totals.sort((a, b) => a.id - b.id),
    ];
  };

  // 1) Load master
useEffect(()=>{
    (async ()=>{
      const [h, cf] = await Promise.all([
        axios.get("http://localhost:5000/hqla_master"),
        axios.get("http://localhost:5000/cashflow_master")
      ]);

      const groupedHQLA = { lvl1:[], lvl2a:[], lvl2b:[] };
      h.data.forEach(r=>{
        if(r.level==="Level 1") groupedHQLA.lvl1.push(r);
        if(r.level==="Level 2A") groupedHQLA.lvl2a.push(r);
        if(r.level==="Level 2B") groupedHQLA.lvl2b.push(r);
      });
      setHQLA(groupedHQLA);

      setNCF({
        outflow: sortWithSubtotal(cf.data.filter(r=>r.kategori.toLowerCase()==="outflow")),
        inflow: sortWithSubtotal(cf.data.filter(r=>r.kategori.toLowerCase()==="inflow"))
      });
    })();
  },[]);

  // 2) Load existing period data
useEffect(()=>{
    if(!periode || !headerId) return;

    (async ()=>{
      const [h, c, s] = await Promise.all([
        axios.get(`http://localhost:5000/api/hqla_data/${periode}`),
        axios.get(`http://localhost:5000/api/cashflow_data/${periode}`),
        axios.get(`http://localhost:5000/api/lcr_summary/${periode}`)
      ]);

      const hv = {};
      (h.data?.data||[]).forEach(r=>hv[r.hqla_master_id]=r.nilai_awal);
      setHqlaValues(hv);

      const cv = {};
      (c.data?.data||[]).forEach(r=>cv[r.cashflow_master_id]=r.nilai_awal);
      setNcfValues(cv);

      setSummary(s.data?.data || null);
    })();
  }, [periode, headerId]);

  // 3) Handlers
  const handleHqlaChange = (id, val) => {
    const cleaned = String(val).replace(/[^\d]/g, "");
    setHqlaValues(prev => ({ ...prev, [id]: cleaned }));
  };
  const handleNcfChange = (id, val) => {
    const cleaned = String(val).replace(/[^\d]/g, "");
    setNcfValues(prev => ({ ...prev, [id]: cleaned }));
  };

  const saveHqla = async ()=>{
    if(!periode || !headerId) return alert("Header belum dipilih");

    let payload=[];
    ["lvl1","lvl2a","lvl2b"].forEach(level=>{
      HQLA[level]?.forEach(row=>{
        if(row.row_type==="subtotal"||row.row_type==="total") return;
        const nilai_awal=Number(hqlaValues[row.id]||0);
        const nilai_after=Math.round(nilai_awal*(1-(row.haircut_rate||0)/100));
        payload.push({
          hqla_master_id: row.id,
          nilai_awal,
          nilai_setelah_haircut: nilai_after,
          used_haircut_rate: row.haircut_rate??0
        });
      });
    });

    await axios.post("http://localhost:5000/api/hqla_data",{ lcr_header_id: headerId, data: payload, user: "admin" });
    await axios.post("http://localhost:5000/api/lcr/recalc",{ periode });
    const s = await axios.get(`http://localhost:5000/api/lcr_summary/${periode}`);
    setSummary(s.data?.data || null);
    alert("Data HQLA tersimpan");
  };

  const saveNcf = async ()=>{
    if(!periode || !headerId) return alert("Header belum dipilih");

    let payload=[];
    ["outflow","inflow"].forEach(cat=>{
      NCF[cat]?.forEach(row=>{
        const nilai_awal=Number(ncfValues[row.id]||0);
        const nilai_terhitung=Math.round(nilai_awal*((row.haircut_rate||0)/100));
        payload.push({
          cashflow_master_id: row.id,
          nilai_awal,
          nilai_terhitung,
          used_percentage: row.haircut_rate??0
        });
      });
    });

    await axios.post("http://localhost:5000/api/cashflow_data",{ lcr_header_id: headerId, data: payload, user: "admin" });
    await axios.post("http://localhost:5000/api/lcr/recalc",{ periode });
    const s = await axios.get(`http://localhost:5000/api/lcr_summary/${periode}`);
    setSummary(s.data?.data || null);
    alert("Data NCF tersimpan");
  };

// TEST UJICOBA GLOBAL STATE
  // const { periode, headerId } = usePeriod();
console.log("periode:", periode, "headerId:", headerId);
 
  return (
    <div className="lcr-page">
      <div className="flex-1 overflow-y-auto main-content p-4">
        <div className="lcr-header d-flex justify-content-between align-items-center mb-3 p-3 shadow-sm rounded bg-white">
          <h2 className="m-0 fw-bold">LCR BJB Syariah</h2>
          <span className="text-muted">Periode: {periode || "-"}</span>
        </div>

{/* Notifikasi jika header belum dipilih */}
{!periode || !headerId ? (
  <div className="alert alert-warning mb-3">
    <strong>Perhatian!</strong> Silakan pilih atau buat <b>Header</b> terlebih dahulu
    sebelum mengisi tabel HQLA dan NCF.
  </div>
) : null}

{/* Form header (create-or-get) */}
<HeaderForm periode={periode} onReady={()=>{ /* opsional: refresh header */ }} />


        {/* HQLA */}
        <div className="mb-4">
          <h4 className="mb-2">High Quality Liquid Assets (HQLA)</h4>
          <HqlaTable
            dataByLevel={HQLA}
            values={hqlaValues}
            onChange={handleHqlaChange}
            onSave={saveHqla}
            formatNum={formatNum}
          />
        </div>

        {/* NCF */}
        <div className="mb-4">
          <h4 className="mb-2">Net Cash Flow (NCF)</h4>
          <NcfTable
            masterGrouped={NCF}
            values={ncfValues}
            onChange={handleNcfChange}
            onSave={saveNcf}
            formatNum={formatNum}
          />
        </div>

{/* SUMMARY */}
<div className="p-3 bg-white shadow-sm rounded">
  <div className="d-flex justify-content-between align-items-center mb-2">
    <h5 className="fw-bold m-0">Ringkasan LCR (server)</h5>
    <button
      className="btn btn-primary btn-sm"
      onClick={async () => {
        if (!periode) return alert("Periode belum dipilih!");
        await axios.post("http://localhost:5000/api/lcr/recalc", { periode });
        const s = await axios.get(`http://localhost:5000/api/lcr_summary/${periode}`);
        setSummary(s.data?.data || null);
        alert("Recalc berhasil dilakukan!");
      }}
    >
      Recalc Manual
    </button>
  </div>

  {summary ? (
    <div className="row text-end">
      <div className="col-md-4">
        <div className="small text-muted">Total HQLA</div>
        <div className="h5">{formatNum(summary.jumlah_hqla)}</div>
      </div>
      <div className="col-md-4">
        <div className="small text-muted">Net Cash Outflow</div>
        <div className="h5">{formatNum(summary.jumlah_net_cash_outflow)}</div>
      </div>
      <div className="col-md-4">
        <div className="small text-muted">LCR (%)</div>
        <div className="h5">{formatNum(summary.nilai_lcr)}</div>
      </div>
    </div>
  ) : (
    <div className="text-muted">Belum ada summary untuk periode ini.</div>
  )}
</div>

      </div>
    </div>
  );
}
