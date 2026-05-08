'use client'
/* TrackWealth — rising price line + floating ticker particles */
import { useEffect, useRef } from 'react'

function CandleChart() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 w-full"
      height="200"
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.12 }}
    >
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#22c55e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d="M0 160 L100 140 L200 145 L300 110 L400 120 L500 90 L600 95 L700 70 L800 75 L900 50 L1000 55 L1100 35 L1200 30 L1200 200 L0 200 Z"
        fill="url(#fillGrad)"
      >
        <animate attributeName="d"
          values="M0 160 L100 140 L200 145 L300 110 L400 120 L500 90 L600 95 L700 70 L800 75 L900 50 L1000 55 L1100 35 L1200 30 L1200 200 L0 200 Z;
                  M0 155 L100 135 L200 150 L300 105 L400 115 L500 85 L600 100 L700 65 L800 70 L900 45 L1000 50 L1100 30 L1200 25 L1200 200 L0 200 Z;
                  M0 160 L100 140 L200 145 L300 110 L400 120 L500 90 L600 95 L700 70 L800 75 L900 50 L1000 55 L1100 35 L1200 30 L1200 200 L0 200 Z"
          dur="8s" repeatCount="indefinite" />
      </path>
      {/* Line */}
      <path
        d="M0 160 L100 140 L200 145 L300 110 L400 120 L500 90 L600 95 L700 70 L800 75 L900 50 L1000 55 L1100 35 L1200 30"
        stroke="url(#lineGrad)" strokeWidth="2" fill="none"
      >
        <animate attributeName="d"
          values="M0 160 L100 140 L200 145 L300 110 L400 120 L500 90 L600 95 L700 70 L800 75 L900 50 L1000 55 L1100 35 L1200 30;
                  M0 155 L100 135 L200 150 L300 105 L400 115 L500 85 L600 100 L700 65 L800 70 L900 45 L1000 50 L1100 30 L1200 25;
                  M0 160 L100 140 L200 145 L300 110 L400 120 L500 90 L600 95 L700 70 L800 75 L900 50 L1000 55 L1100 35 L1200 30"
          dur="8s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

export default function AnimatedBackground() {
  const tickers = ['+2.4%', '$AAPL', '+5.1%', '$TSLA', '-0.8%', '$BTC', '+12%', '$SPX', '$ETH', '+3.2%']
  const positions = [
    { x: '5%',  y: '12%', delay: '0s'  },
    { x: '82%', y: '8%',  delay: '2s'  },
    { x: '15%', y: '70%', delay: '4s'  },
    { x: '88%', y: '60%', delay: '1s'  },
    { x: '40%', y: '85%', delay: '3s'  },
    { x: '65%', y: '20%', delay: '5s'  },
    { x: '25%', y: '40%', delay: '1.5s'},
    { x: '75%', y: '78%', delay: '2.5s'},
    { x: '52%', y: '5%',  delay: '3.5s'},
    { x: '10%', y: '50%', delay: '4.5s'},
  ]
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Green finance gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 20% 30%, rgba(34,197,94,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(52,211,153,0.10) 0%, transparent 60%)',
      }} />

      {/* Animated chart */}
      <CandleChart />

      {/* Grid lines — finance terminal style */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px)',
        backgroundSize: '60px 40px',
        opacity: 0.6,
      }} />

      {/* Floating tickers */}
      {positions.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.x, top: p.y,
          fontSize: '11px', fontWeight: 600, fontFamily: 'monospace',
          color: tickers[i].startsWith('-') ? '#f87171' : '#22c55e',
          opacity: 0.4,
          animation: `float ${5 + i * 0.5}s ease-in-out infinite`,
          animationDelay: p.delay,
          letterSpacing: '0.05em',
        }}>{tickers[i]}</div>
      ))}

      <div className="orb orb-1" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.18), rgba(52,211,153,0.08) 60%, transparent)', top: '-100px', left: '-80px' }} />
      <div className="orb orb-3" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.12), transparent 70%)', bottom: '10%', right: '10%' }} />
    </div>
  )
}
