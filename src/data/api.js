import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:5000" });

export const getHqlaMaster = () => api.get("/hqla_master").then(r => r.data);
export const getCashflowMaster = () => api.get("/cashflow_master").then(r => r.data);

export const upsertHeader = (payload) => api.post("/api/lcr_header", payload).then(r=>r.data);
export const getHqlaData = (periode) => api.get(`/api/hqla_data/${periode}`).then(r=>r.data);
export const saveHqlaData = (body) => api.post("/api/hqla_data", body).then(r=>r.data);

export const getCashflowData = (periode) => api.get(`/api/cashflow_data/${periode}`).then(r=>r.data);
export const saveCashflowData = (body) => api.post("/api/cashflow_data", body).then(r=>r.data);

export const recalc = (periode) => api.post("/api/lcr/recalc", { periode }).then(r=>r.data);
export const getSummary = (periode) => api.get(`/api/lcr_summary/${periode}`).then(r=>r.data);

// Daftar periode dari lcr_header
export const getPeriodes = () => api.get("/api/periodes").then(r => r.data);

// Trend summary semua periode
export const getTrend = () => api.get("/api/lcr_trend").then(r => r.data);
