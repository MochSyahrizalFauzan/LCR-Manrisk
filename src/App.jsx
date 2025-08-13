import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LCR from './pages/LCR';
import NCF from './pages/NCF';

// import Test from './pages/Test';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/lcr" element={<LCR />} />
      <Route path="/ncf" element={<NCF />} />
      {/* <Route path="/test" element={<Test />} /> */}
    </Routes>
  );
}

export default App;
