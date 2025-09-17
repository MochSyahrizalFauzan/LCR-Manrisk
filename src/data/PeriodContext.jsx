// src/data/PeriodContext.js
import React, { createContext, useContext, useState } from "react";

// Buat context
const PeriodContext = createContext();

// Provider untuk membungkus App
export const PeriodProvider = ({ children }) => {
  const [month, setMonth] = useState("2025-08"); // default value
  return (
    <PeriodContext.Provider value={{ month, setMonth }}>
      {children}
    </PeriodContext.Provider>
  );
};

// Hook custom biar lebih rapi saat dipakai di komponen
export const usePeriod = () => {
  return useContext(PeriodContext);
};
