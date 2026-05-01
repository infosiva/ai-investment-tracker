/**
 * theme.config.ts — swap to restyle InvestIQ
 * 2026 Design: Terminal Pro — Bloomberg-meets-glassmorphism, data-dense, command-line aesthetic
 */

export const theme = {
  name:    'WealthPilot',
  tagline: 'Your portfolio, analysed by AI.',
  sub:     'Real-time prices · AI risk insights · Price alerts · Allocation tracking',

  style: 'terminal' as const,

  bg:          '#04060a',
  bgCard:      'rgba(0,255,100,0.02)',
  bgCardHover: 'rgba(0,255,100,0.04)',
  border:      'rgba(0,255,100,0.12)',
  borderHover: 'rgba(0,255,100,0.25)',

  accent1:    '#00ff64',           // terminal green
  accent2:    '#00d4aa',           // teal
  accent3:    '#f59e0b',           // amber — alerts
  accentText: '#86efac',
  accentGlow: 'rgba(0,255,100,0.08)',

  blobs: [],                       // terminal has no blobs — scanline grid instead

  fontHeading: "'JetBrains Mono', 'Fira Code', monospace",
  fontBody:    "'JetBrains Mono', 'Fira Code', monospace",
  fontMono:    "'JetBrains Mono', monospace",

  badges: [
    '► LIVE PRICES',
    '► CLAUDE AI',
    '► ALERTS',
    '► HISTORY',
    '► ALLOCATION',
  ],

  pricing: [
    {
      name: 'FREE', price: '$0', sub: 'forever', highlight: false,
      features: ['3 analyses / day', 'Live Yahoo Finance', 'AI insights', 'Price alerts', '30-day history', 'Allocation charts'],
      cta: 'Current plan',
    },
    {
      name: 'PRO', price: '$7', sub: '/month', highlight: true,
      features: ['Unlimited analyses', 'Email alerts', 'CSV / PDF export', 'Multi-portfolio', 'AI rebalancing', 'Priority speed'],
      cta: 'UPGRADE →',
    },
  ],

  metaTitle:       'WealthPilot — AI Portfolio Tracker & Analyser',
  metaDescription: 'Track your stock portfolio with live prices, AI insights and price alerts. Free to start, no sign-up required.',
}

export type Theme = typeof theme
export default theme
