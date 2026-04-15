import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import Onboard              from './pages/Onboard.jsx';
import Board                from './pages/Board.jsx';
import Login                from './pages/Login.jsx';
import ResetPassword        from './pages/ResetPassword.jsx';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm.jsx';
import Canvas               from './pages/Canvas.jsx';
import Vault                from './pages/Vault.jsx';
import Home                 from './pages/Home.jsx';
import ConnectApps          from './pages/ConnectApps.jsx';

function Root() {
  const saved  = localStorage.getItem('juno_user');
  const params = new URLSearchParams(window.location.search);
  const mock   = params.get('user');
  if (mock) return <Navigate to={`/board?user=${mock}`} replace />;
  return <Navigate to={saved ? '/home' : '/join'} replace />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/join"           element={<Onboard />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/board"          element={<Board />} />
        <Route path="/canvas"          element={<Canvas />} />
        <Route path="/vault"           element={<Vault />} />
        <Route path="/home"            element={<Home />} />
        <Route path="/apps"            element={<ConnectApps />} />
        <Route path="/demo"           element={<Navigate to="/board?user=current" replace />} />
        <Route path="/reset"          element={<ResetPassword />} />
        <Route path="/reset-confirm"  element={<ResetPasswordConfirm />} />
        <Route path="/*"              element={<Root />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
