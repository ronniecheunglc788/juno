import { useState } from 'react';
import CuteRoomCanvas from '../components/CuteRoomCanvas';

export default function CuteRoom() {
  const [angleIndex, setAngleIndex] = useState(0);

  function rotateLeft()  { setAngleIndex(i => (i + 3) % 4); }
  function rotateRight() { setAngleIndex(i => (i + 1) % 4); }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#F5C8C8' }}>
      <CuteRoomCanvas targetAngleIndex={angleIndex} />

      {/* Logo */}
      <img
        src="/juno_logo.png"
        alt="Juno"
        style={{ position: 'absolute', top: 20, left: 24, height: 24, opacity: 0.5, zIndex: 40, pointerEvents: 'none' }}
      />

      {/* Rotate buttons */}
      <div style={{
        position:  'absolute',
        bottom:    32,
        left:      '50%',
        transform: 'translateX(-50%)',
        display:   'flex',
        gap:       12,
        zIndex:    40,
      }}>
        {[['←', rotateLeft], ['→', rotateRight]].map(([label, fn]) => (
          <button
            key={label}
            onClick={fn}
            style={{
              width:         48,
              height:        48,
              borderRadius:  '50%',
              border:        '1px solid rgba(255,255,255,0.4)',
              background:    'rgba(255,255,255,0.25)',
              backdropFilter:'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              cursor:        'pointer',
              fontSize:      20,
              color:         'rgba(180,80,100,0.9)',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              transition:    'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.42)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
