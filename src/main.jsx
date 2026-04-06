import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App      from './App.jsx';
import Onboard  from './pages/Onboard.jsx';
import Board    from './pages/Board.jsx';
import Login    from './pages/Login.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/join"  element={<Onboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/board" element={<Board />} />
        <Route path="/*"     element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
