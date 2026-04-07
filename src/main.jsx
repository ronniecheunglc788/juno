import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App      from './App.jsx';
import Onboard  from './pages/Onboard.jsx';
import Board    from './pages/Board.jsx';
import Login    from './pages/Login.jsx';

function Root() {
  const saved = localStorage.getItem('breeze_user');
  return <Navigate to={saved ? '/board' : '/join'} replace />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/preview" element={<App />} />
        <Route path="/join"  element={<Onboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/board" element={<Board />} />
        <Route path="/*"     element={<Root />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
