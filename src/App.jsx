// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import LCR from "./pages/LCR";
import NCF from "./pages/NCF";
import Navbar from "./components/Navbar";
import { PeriodProvider } from "./data/PeriodContext";
import CustomDatePicker from "./components/CustomDatePicker";

function App() {
  return (
    <PeriodProvider>
      <Navbar />
      {/* <CustomDatePicker /> */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/lcr" element={<LCR />} />
        <Route path="/ncf" element={<NCF />} />
      </Routes>
    </PeriodProvider>
  );
}

export default App;
