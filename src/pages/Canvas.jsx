import { useState, useRef, useEffect } from 'react';
import CurrentBoard  from '../components/boards/CurrentBoard';
import FireflyBoard  from '../components/boards/FireflyBoard';
import MossBoard     from '../components/boards/MossBoard';
import RootBoard     from '../components/boards/RootBoard';
import SeedlingBoard from '../components/boards/SeedlingBoard';
import TendrilBoard  from '../components/boards/TendrilBoard';
import { MOCK_PROFILES, PEOPLE } from '../data/mockProfiles';

const TABS = [
  { key: 'current',  label: 'Current',  color: '#DC2626', Board: CurrentBoard  },
  { key: 'firefly',  label: 'Firefly',  color: '#D97706', Board: FireflyBoard  },
  { key: 'moss',     label: 'Moss',     color: '#0F766E', Board: MossBoard     },
  { key: 'root',     label: 'Root',     color: '#FF6B00', Board: RootBoard     },
  { key: 'seedling', label: 'Seedling', color: '#7C3AED', Board: SeedlingBoard },
  { key: 'tendril',  label: 'Tendril',  color: '#059669', Board: TendrilBoard  },
];

export default function Canvas() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen]               = useState(false);
  const dropdownRef                   = useRef(null);

  const active      = TABS[activeIndex];
  const data        = PEOPLE[active.key] ?? MOCK_PROFILES[active.key] ?? null;
  const { Board }   = active;

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: "'Satoshi', 'DM Sans', system-ui, sans-serif" }}>

      {/* Board — full bleed */}
      <Board key={active.key} data={data} loading={false} />

      {/* Logo — top left */}
      <img
        src="/juno_logo.png"
        alt="Juno"
        style={{
          position:  'absolute',
          top:       20,
          left:      24,
          height:    26,
          width:     'auto',
          userSelect: 'none',
          opacity:   0.85,
          zIndex:    40,
          pointerEvents: 'none',
        }}
      />

      {/* Dropdown — top left, under logo */}
      <div ref={dropdownRef} style={{ position: 'absolute', top: 56, left: 24, zIndex: 40 }}>

        {/* Trigger pill */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            8,
            padding:        '6px 12px 6px 10px',
            borderRadius:   20,
            border:         `1px solid ${active.color}40`,
            background:     'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            cursor:         'pointer',
            fontFamily:     "'PPMondwest', system-ui, sans-serif",
            fontSize:       12,
            color:          active.color,
            letterSpacing:  '0.3px',
            transition:     'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
        >
          <div style={{
            width:        7,
            height:       7,
            borderRadius: '50%',
            background:   active.color,
            flexShrink:   0,
          }} />
          {active.label}
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s', marginLeft: 2 }}
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Menu */}
        {open && (
          <div style={{
            position:       'absolute',
            top:            'calc(100% + 6px)',
            left:           0,
            minWidth:       140,
            borderRadius:   12,
            border:         '1px solid rgba(255,255,255,0.12)',
            background:     'rgba(20,20,28,0.82)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            overflow:       'hidden',
            boxShadow:      '0 8px 32px rgba(0,0,0,0.35)',
          }}>
            {TABS.map((tab, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveIndex(i); setOpen(false); }}
                  style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         10,
                    width:       '100%',
                    padding:     '9px 14px',
                    border:      'none',
                    background:  isActive ? `${tab.color}18` : 'transparent',
                    cursor:      'pointer',
                    fontFamily:  "'PPMondwest', system-ui, sans-serif",
                    fontSize:    12,
                    color:       isActive ? tab.color : 'rgba(255,255,255,0.6)',
                    letterSpacing: '0.3px',
                    textAlign:   'left',
                    transition:  'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width:        6,
                    height:       6,
                    borderRadius: '50%',
                    background:   tab.color,
                    opacity:      isActive ? 1 : 0.45,
                    flexShrink:   0,
                  }} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
