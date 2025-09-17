import React, { useState, useEffect, useRef } from "react";
import "../style/DatePicker.css";

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function CustomDatePicker({ month: propMonth, year: propYear, onChange }) {
  const [openMonth, setOpenMonth] = useState(false);
  const [openYear, setOpenYear] = useState(false);
  const wrapperRef = useRef();

  useEffect(() => { 
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpenMonth(false);
        setOpenYear(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Years list (±5 years dari propYear)
  const start = (propYear || new Date().getFullYear()) - 5;
  const years = Array.from({ length: 11 }, (_, i) => start + i);

  function select(month, year) {
    onChange?.(month, year);
  }

  return (
    <div className="datepicker" ref={wrapperRef}>
      <div className="dp-control">
        <div className="label">Month</div>
        <button className="dp-button" onClick={() => setOpenMonth((s) => !s)}>
          <div>
            <div className="dp-value">{propMonth}</div>
          </div>
          <div className="caret">{openMonth ? "▲" : "▼"}</div>
        </button>
        {openMonth && (
          <div className="dp-dropdown">
            {months.map((m) => (
              <div key={m} className={`dp-item ${m === propMonth ? "selected" : ""}`}
                onClick={() => select(m, propYear)}>
                {m}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dp-control">
        <div className="label">Year</div>
        <button className="dp-button" onClick={() => setOpenYear((s) => !s)}>
          <div>
            <div className="dp-value">{propYear}</div>
          </div>
          <div className="caret">{openYear ? "▲" : "▼"}</div>
        </button>
        {openYear && (
          <div className="dp-dropdown">
            {years.map((y) => (
              <div key={y} className={`dp-item ${y === propYear ? "selected" : ""}`}
                   onClick={() => select(propMonth, y)}>
                {y}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
