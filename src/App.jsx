// App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar"; 
import Dashboard from "./pages/Dashboard";
import LCR from "./pages/LCR";

function App() {
  return (
    <>
      {/* Navbar tampil di semua halaman */}
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/lcr" element={<LCR />} />
      </Routes>
    </>
  );
}

export default App;
