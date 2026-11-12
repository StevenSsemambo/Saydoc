import React, { useEffect, useState } from 'react'

// SayMyDoc SVG logo inline — speech bubble + ECG pulse + medical cross
function SayMyDocLogo({ size = 72 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="smdbg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#08162D"/>
          <stop offset="100%" stopColor="#052637"/>
        </linearGradient>
      </defs>
      {/* Squircle background */}
      <rect width="100" height="100" rx="22" fill="url(#smdbg)"/>
      {/* Speech bubble body */}
      <rect x="12" y="15" width="70" height="48" rx="12" fill="white"/>
      {/* Bubble tail */}
      <polygon points="24,63 15,82 42,63" fill="white"/>
      {/* ECG pulse line */}
      <polyline
        points="18,39 32,39 37,29 40,39 44,21 49,53 54,33 58,39 82,39"
        stroke="#00C97A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      {/* Medical cross top-right inside bubble */}
      <rect x="72" y="19" width="4" height="13" rx="2" fill="#00C97A"/>
      <rect x="67" y="24" width="13" height="4" rx="2" fill="#00C97A"/>
    </svg>
  )
}

export default function LoadingScreen() {
  const [dots, setDots] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 450)
    return () => clearInterval(t)
  }, [])

  const dotStr = '.'.repeat(dots)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(160deg, #08162D 0%, #052637 50%, #071E30 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '0px', fontFamily: "'Poppins', sans-serif",
    }}>

      {/* Glow ring behind logo */}
      <div style={{
        position: 'relative', marginBottom: '28px',
      }}>
        <div style={{
          position: 'absolute', inset: '-18px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,201,122,0.18) 0%, transparent 70%)',
          animation: 'smd-pulse 2.2s ease-in-out infinite',
        }}/>
        <div style={{
          borderRadius: '26px',
          boxShadow: '0 0 40px rgba(0,201,122,0.25), 0 8px 32px rgba(0,0,0,0.5)',
          animation: 'smd-float 3s ease-in-out infinite',
        }}>
          <SayMyDocLogo size={96} />
        </div>
      </div>

      {/* App name */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{
          margin: 0, fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px',
          background: 'linear-gradient(135deg, #ffffff 30%, #00C97A 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          SayMyDoc
        </h1>
        <p style={{
          margin: '6px 0 0', fontSize: '13px', fontWeight: '500',
          color: 'rgba(180,220,200,0.65)', letterSpacing: '0.04em',
        }}>
          Your intelligent health companion
        </p>
      </div>

      {/* Loading indicator */}
      <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#00C97A',
              animation: `smd-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.3,
            }}/>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(150,200,175,0.5)', letterSpacing: '0.06em' }}>
          Loading{dotStr}
        </p>
      </div>

      {/* Developer credit */}
      <div style={{
        position: 'absolute', bottom: '32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
      }}>
        <div style={{
          width: '40px', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,201,122,0.4), transparent)',
          marginBottom: '10px',
        }}/>
        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(140,190,165,0.45)', letterSpacing: '0.05em' }}>
          Developed by
        </p>
        <p style={{
          margin: 0, fontSize: '13px', fontWeight: '700',
          color: 'rgba(0,201,122,0.75)', letterSpacing: '0.03em',
        }}>
          Steven · SayMyTech Developers
        </p>
        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(120,170,145,0.35)', letterSpacing: '0.04em' }}>
          Kampala, Uganda 🇺🇬
        </p>
      </div>

      <style>{`
        @keyframes smd-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes smd-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes smd-dot {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.3; }
          40% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
