import { useState } from 'react';
import IMessageSimulator from './components/IMessageSimulator';
import OrbitMap from './components/OrbitMap';
import OrbitMap2 from './components/OrbitMap2';
import GeorgeMap from './components/GeorgeMap';
import ImportDemos from './components/ImportDemos';
import MomentsDemos from './components/MomentsDemos';
import KaitlynBoard from './components/KaitlynBoard';
import ContextBuilder from './components/ContextBuilder';
import './index.css';

const VIEWS = [
  { id: 'imessage', label: 'iMessage',   sub: 'what you experience' },
  { id: 'moments',  label: 'Moments',    sub: 'magic in real life'  },
  { id: 'orbit',    label: 'Orbit Map',  sub: 'what Breeze sees'    },
  { id: 'orbit2',   label: 'Orbit 2',   sub: 'Samuel Arosti'       },
  { id: 'george',   label: 'George',    sub: 'BU Biomedical Eng'   },
  { id: 'import',   label: 'Import',     sub: 'where it goes'       },
  { id: 'kaitlyn',  label: 'Kaitlyn',    sub: 'designer\'s board'   },
  { id: 'context',  label: 'Upload',     sub: 'build your context'  },
];

export default function App() {
  const [activeView, setActiveView] = useState('imessage');
  const isOrbit = activeView === 'orbit' || activeView === 'orbit2' || activeView === 'george';
  const isMoments = activeView === 'moments';
  const isKaitlyn = activeView === 'kaitlyn';

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#08080F', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Nav bar — floats over orbit, stacked above others ────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '14px 32px',
        borderBottom: (isOrbit || isMoments || isKaitlyn) ? 'none' : '1px solid rgba(255,255,255,0.08)',
        background: (isOrbit || isMoments || isKaitlyn) ? 'transparent' : 'rgba(8,8,15,0.95)',
        backdropFilter: (isOrbit || isMoments || isKaitlyn) ? 'none' : 'blur(24px)',
        position: (isOrbit || isMoments || isKaitlyn) ? 'absolute' : 'relative',
        top: (isOrbit || isMoments || isKaitlyn) ? 0 : 'auto',
        left: (isOrbit || isMoments || isKaitlyn) ? 0 : 'auto',
        right: (isOrbit || isMoments || isKaitlyn) ? 0 : 'auto',
        zIndex: 200,
        flexShrink: 0,
        pointerEvents: 'auto',
      }}>

        {/* Logo */}
        <div style={{ position: 'absolute', left: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C9A84C, #3C3489)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
            boxShadow: '0 0 14px rgba(201,168,76,0.35)',
          }}>B</div>
          <span style={{ color: '#C9A84C', fontWeight: 800, fontSize: 16, letterSpacing: '1.5px' }}>BREEZE</span>
        </div>

        {/* Tabs */}
        {VIEWS.map(view => {
          const active = activeView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              style={{
                background: active
                  ? (isOrbit || isMoments || isKaitlyn) ? 'rgba(201,168,76,0.14)' : 'rgba(201,168,76,0.12)'
                  : (isOrbit || isMoments || isKaitlyn) ? 'rgba(0,0,0,0.55)' : 'transparent',
                border: `1px solid ${active ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: 12, padding: '9px 22px', cursor: 'pointer',
                transition: 'all 0.2s ease', textAlign: 'center',
                boxShadow: active ? '0 0 16px rgba(201,168,76,0.1)' : 'none',
                backdropFilter: (isOrbit || isMoments || isKaitlyn) ? 'blur(16px)' : 'none',
              }}
            >
              <div style={{
                color: active ? '#C9A84C' : '#aaa',
                fontWeight: active ? 700 : 500, fontSize: 14,
                transition: 'color 0.2s',
              }}>{view.label}</div>
              <div style={{ color: active ? 'rgba(201,168,76,0.6)' : '#444', fontSize: 11, marginTop: 2 }}>{view.sub}</div>
            </button>
          );
        })}

        <div style={{ position: 'absolute', right: 28, color: '#333', fontSize: 11, letterSpacing: '0.5px' }}>demo build</div>
      </div>

      {/* ── Main view ────────────────────────────────────────────────────── */}
      <div style={{
        flex: (isOrbit || isMoments || isKaitlyn) ? 'none' : 1,
        position: (isOrbit || isMoments || isKaitlyn) ? 'absolute' : 'relative',
        inset: (isOrbit || isMoments || isKaitlyn) ? 0 : 'auto',
        overflow: 'hidden',
        height: (isOrbit || isMoments || isKaitlyn) ? '100vh' : undefined,
      }}>
        {activeView === 'imessage' && <IMessageSimulator key="imessage" />}
        {activeView === 'moments'  && <MomentsDemos      key="moments"  />}
        {activeView === 'orbit'    && <OrbitMap           key="orbit"    />}
        {activeView === 'orbit2'   && <OrbitMap2          key="orbit2"   />}
        {activeView === 'george'   && <GeorgeMap          key="george"   />}
        {activeView === 'import'   && <ImportDemos        key="import"   />}
        {activeView === 'kaitlyn'  && <KaitlynBoard       key="kaitlyn"  />}
        {activeView === 'context'  && <ContextBuilder     key="context"  />}
      </div>
    </div>
  );
}
