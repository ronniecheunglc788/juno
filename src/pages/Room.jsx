import { useState } from 'react';
import RoomCanvas from '../components/RoomCanvas';

const ZOOM_MIN = 0.5;   // zoomed in  (smaller frustum)
const ZOOM_MAX = 1.4;   // zoomed out (larger frustum)
const ZOOM_STEP = 0.15;

function IconBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.25)',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        cursor: 'pointer', fontSize: 20,
        color: 'rgba(255,255,255,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
    >
      {children}
    </button>
  );
}

export default function Room() {
  const [angleIndex, setAngleIndex] = useState(0);
  const [zoom, setZoom]             = useState(1.0);

  function rotateLeft()  { setAngleIndex(i => (i + 3) % 4); }
  function rotateRight() { setAngleIndex(i => (i + 1) % 4); }
  function zoomIn()      { setZoom(z => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(2)))); }
  function zoomOut()     { setZoom(z => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(2)))); }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#B0ACA6' }}>
      <RoomCanvas targetAngleIndex={angleIndex} zoom={zoom} />

      {/* Logo */}
      <img
        src="/juno_logo.png" alt="Juno"
        style={{ position: 'absolute', top: 20, left: 24, height: 24, opacity: 0.6, zIndex: 40, pointerEvents: 'none' }}
      />

      {/* Controls */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 10, zIndex: 40,
      }}>
        <IconBtn onClick={rotateLeft}>←</IconBtn>
        <IconBtn onClick={rotateRight}>→</IconBtn>

        {/* Divider */}
        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />

        <IconBtn onClick={zoomIn}>+</IconBtn>
        <IconBtn onClick={zoomOut}>−</IconBtn>
      </div>
    </div>
  );
}
