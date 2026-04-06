import { useState } from 'react';

// ── Keyframes ─────────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes cardUp {
    from { transform: translateY(18px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes checkPop {
    0%  { transform: scale(0.4); opacity: 0; }
    70% { transform: scale(1.15); }
    100%{ transform: scale(1); opacity: 1; }
  }
  @keyframes pillIn {
    from { transform: translateY(6px); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }
`;

// ── Palette ───────────────────────────────────────────────────────────────────
const BG        = '#EDF2F7';   // very light blue-gray page bg
const CARD      = '#FFFFFF';
const ACCENT    = '#4A90D9';   // iOS-ish blue
const ACCENT_LT = '#E8F1FB';   // light blue tint
const TEXT_PRI  = '#1A202C';
const TEXT_SEC  = '#718096';
const TEXT_DIM  = '#A0AEC0';
const PILL_BG   = '#F1F5F9';
const PILL_BDR  = '#E2E8F0';
const GREEN     = '#38A169';
const GREEN_LT  = '#C6F6D5';

// ── Food photo colours (placeholder blocks w/ emoji) ─────────────────────────
const FOOD_PHOTOS = [
  { color: '#FDEBD0', emoji: '🥣', label: 'Acai bowl'     },
  { color: '#D5F5E3', emoji: '🥗', label: 'Salad'         },
  { color: '#D6EAF8', emoji: '🍱', label: 'Chicken bowl'  },
  { color: '#FCF3CF', emoji: '🍌', label: 'Smoothie'      },
];

const DAYS = [
  { key: 'WED', done: true,  emoji: '🥣' },
  { key: 'THU', done: true,  emoji: '🥗' },
  { key: 'FRI', done: true,  emoji: '🍱' },
  { key: 'SAT', done: true,  emoji: '🍇' },
  { key: 'SUN', done: true,  emoji: '🥑' },
  { key: 'MON', done: true,  emoji: '🥣' },
  { key: 'TUE', done: false, emoji: null },
];

const MEALS = [
  { time: '8:00 am',  name: 'Acai bowl',    color: '#FC8181' },
  { time: '1:00 pm',  name: 'Chicken bowl', color: '#68D391' },
];

// ── Card 1 — Smart Notification ───────────────────────────────────────────────
function NotificationCard() {
  const [calPressed,   setCalPressed]   = useState(false);
  const [emailPressed, setEmailPressed] = useState(false);

  return (
    <div style={{
      background: CARD,
      borderRadius: 20,
      padding: '22px 20px 18px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
      animation: 'cardUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
    }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRI, letterSpacing: '-0.4px' }}>
          Hey Ronnie! 👋
        </div>
        {/* Cloud icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: ACCENT_LT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>☁️</div>
      </div>

      {/* AI message bubble */}
      <div style={{
        background: ACCENT_LT,
        borderRadius: 14,
        padding: '13px 15px',
        marginBottom: 16,
        position: 'relative',
      }}>
        {/* Breeze label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: 5,
            background: `linear-gradient(135deg, #C9A84C, #4A90D9)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: '#fff',
          }}>B</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: '0.2px' }}>Breeze</span>
        </div>
        <div style={{
          fontSize: 14, color: TEXT_PRI, lineHeight: 1.6, fontWeight: 400,
        }}>
          Your TA just emailed offering office hours — I already scheduled it for{' '}
          <span style={{ fontWeight: 700, color: ACCENT }}>Thursday at 4pm</span>{' '}
          so you can ask about the part you're stuck on!
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'View Calendar', onPress: setCalPressed,   pressed: calPressed   },
          { label: 'View Email',    onPress: setEmailPressed, pressed: emailPressed },
        ].map(({ label, onPress, pressed }) => (
          <button
            key={label}
            onMouseDown={() => onPress(true)}
            onMouseUp={() => onPress(false)}
            onMouseLeave={() => onPress(false)}
            style={{
              flex: 1,
              background: pressed ? ACCENT_LT : PILL_BG,
              border: `1px solid ${pressed ? '#BDD7F5' : PILL_BDR}`,
              borderRadius: 100,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 600,
              color: pressed ? ACCENT : TEXT_SEC,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Card 2 — Meal Streak ──────────────────────────────────────────────────────
function MealStreakCard() {
  const [detailsPressed, setDetailsPressed] = useState(false);
  const [thanksPressed,  setThanksPressed]  = useState(false);

  return (
    <div style={{
      background: CARD,
      borderRadius: 20,
      padding: '20px 20px 18px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
      animation: 'cardUp 0.48s 0.08s cubic-bezier(0.22,1,0.36,1) both',
    }}>

      {/* Card top row: title + Breeze label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRI, letterSpacing: '-0.2px' }}>
          Healthy Meal Streak
        </div>
        <div style={{
          background: ACCENT_LT, borderRadius: 8, padding: '3px 10px',
          fontSize: 11, fontWeight: 700, color: ACCENT,
        }}>Breeze</div>
      </div>

      {/* Photo collage */}
      <div style={{ position: 'relative', height: 110, marginBottom: 18 }}>
        {FOOD_PHOTOS.map((photo, i) => {
          const rotations  = [-8, 5, -3, 9];
          const xOffsets   = [0, 52, 104, 156];
          const yOffsets   = [8, 0, 10, 2];
          const zIndex     = i === 1 ? 4 : i === 0 ? 3 : i === 2 ? 2 : 1;
          return (
            <div
              key={photo.label}
              style={{
                position: 'absolute',
                left: `calc(50% - 84px + ${xOffsets[i]}px)`,
                top: yOffsets[i],
                width: 72, height: 72,
                borderRadius: 14,
                background: photo.color,
                border: '2.5px solid #fff',
                boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
                transform: `rotate(${rotations[i]}deg)`,
                zIndex,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}
            >
              {photo.emoji}
            </div>
          );
        })}
      </div>

      {/* Streak headline */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 4 }}>
          6 Day Streak
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: TEXT_PRI, letterSpacing: '-0.3px', marginBottom: 4 }}>
          Healthy Meal Streak!
        </div>
        <div style={{ fontSize: 13, color: TEXT_SEC, lineHeight: 1.5 }}>
          You've been eating clean for 6 days straight — keep it up!
        </div>
      </div>

      {/* Day tracker */}
      <div style={{
        background: PILL_BG, borderRadius: 14, padding: '12px 10px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {DAYS.map((day, i) => (
            <div key={day.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
              {/* Circle */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: day.done ? '#fff' : ACCENT_LT,
                  border: day.done ? '1.5px solid #E2E8F0' : `2px solid ${ACCENT}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: day.done ? 16 : 12,
                  color: day.done ? undefined : ACCENT,
                }}>
                  {day.done ? day.emoji : ''}
                </div>
                {/* Green checkmark badge */}
                {day.done && (
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 14, height: 14, borderRadius: '50%',
                    background: GREEN, border: '1.5px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: `checkPop 0.3s ${0.05 * i}s cubic-bezier(0.22,1,0.36,1) both`,
                  }}>
                    <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
                      <path d="M1 2.5L2.8 4.2L6 1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              {/* Day label */}
              <div style={{
                fontSize: 9, fontWeight: day.done ? 500 : 700,
                color: day.done ? TEXT_DIM : ACCENT,
                letterSpacing: '0.3px',
              }}>{day.key}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day insight section */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_DIM, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
          Day Insight
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_PRI, marginBottom: 10 }}>
          Tuesday, March 31
        </div>
        {/* Meal timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MEALS.map((meal, i) => (
            <div key={meal.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              animation: `pillIn 0.3s ${0.1 + i * 0.08}s ease both`,
            }}>
              <div style={{ width: 3, height: 36, borderRadius: 99, background: meal.color, flexShrink: 0 }} />
              <div style={{
                flex: 1, background: PILL_BG, borderRadius: 10,
                padding: '7px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_PRI }}>{meal.name}</div>
                <div style={{ fontSize: 12, color: TEXT_DIM }}>{meal.time}</div>
              </div>
            </div>
          ))}

          {/* Still going pill */}
          <div style={{
            marginTop: 2,
            background: GREEN_LT, borderRadius: 10, padding: '7px 12px',
            display: 'flex', alignItems: 'center', gap: 7,
            animation: 'pillIn 0.3s 0.28s ease both',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
            <div style={{ fontSize: 12, fontWeight: 500, color: GREEN }}>
              Day is still going — you're on track.
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { label: 'Details',  onPress: setDetailsPressed, pressed: detailsPressed },
          { label: 'Thanks!',  onPress: setThanksPressed,  pressed: thanksPressed  },
        ].map(({ label, onPress, pressed }) => (
          <button
            key={label}
            onMouseDown={() => onPress(true)}
            onMouseUp={() => onPress(false)}
            onMouseLeave={() => onPress(false)}
            style={{
              flex: 1,
              background: pressed ? ACCENT_LT : PILL_BG,
              border: `1px solid ${pressed ? '#BDD7F5' : PILL_BDR}`,
              borderRadius: 100,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 600,
              color: pressed ? ACCENT : TEXT_SEC,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function MomentsDemos() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
      <div style={{
        width: '100%', height: '100%',
        background: BG,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', overflowX: 'hidden',
        padding: '28px 0 40px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif',
      }}>
        <div style={{ width: 390, display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px' }}>
          <NotificationCard />
          <MealStreakCard />
        </div>
      </div>
    </>
  );
}
