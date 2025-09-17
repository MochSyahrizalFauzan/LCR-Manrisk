// data/PeriodContext.jsx
import { createContext, useContext, useState } from "react";

const PeriodContext = createContext();

export const PeriodProvider = ({ children }) => {
  const [periode, setPeriode] = useState("");
  const [headerId, setHeaderId] = useState(null);

  return (
    <PeriodContext.Provider value={{ periode, setPeriode, headerId, setHeaderId }}>
      {children}
    </PeriodContext.Provider>
  );
};

export const usePeriod = () => useContext(PeriodContext);
