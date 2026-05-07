'use client'
import { useState, useEffect, useCallback } from 'react'

// Rate limit: 3 free analyses per day
function useRateLimit(key: string, limit: number) {
  const getUsage = useCallback(() => {
    if (typeof window === 'undefined') return { count: 0, date: '' }
    try { return JSON.parse(localStorage.getItem(key) || '{"count":0,"date":""}') } catch { return { count: 0, date: '' } }
  }, [key])

  const today = new Date().toISOString().split('T')[0]
  const usage = getUsage()
  const count = usage.date === today ? usage.count : 0
  const remaining = Math.max(0, limit - count)

  const increment = useCallback(() => {
    const d = new Date().toISOString().split('T')[0]
    const u = getUsage()
    const c = u.date === d ? u.count + 1 : 1
    localStorage.setItem(key, JSON.stringify({ count: c, date: d }))
  }, [key, getUsage])

  return { remaining, increment, isLimited: remaining === 0 }
}

interface Holding { ticker: string; shares: string; buyPrice: string }
interface Result { ticker: string; shares: number; buy_price: number; current_price: number; current_value: number; gain_loss_pct: number; error?: string }
interface HistoryEntry { date: string; value: number; cost: number }
interface PortfolioResult { holdings: Result[]; total_value: number; total_cost: number; total_gain_loss_pct: number; insights?: string }
interface Alert { ticker: string; targetPrice: number; direction: 'above' | 'below'; triggered?: boolean }

const COLORS: Record<string, string> = {
  AAPL:'#00ff64', MSFT:'#00d4ff', GOOGL:'#ffaa00', AMZN:'#ff6600',
  TSLA:'#ff4444', META:'#4488ff', NVDA:'#aa44ff', NFLX:'#ff3333',
  JPM:'#00ccff', default: '#00ff64',
}

function MiniSparkline({ history }: { history: HistoryEntry[] }) {
  if (history.length < 2) return <span className="text-xs opacity-30">no data</span>
  const vals = history.map(h => h.value)
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1
  const w = 80, h = 24
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
  const up = vals[vals.length - 1] >= vals[0]
  return (
    <svg width={w} height={h}>
      <polyline points={pts.join(' ')} fill="none" stroke={up ? '#00ff64' : '#ff4444'} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function AllocationBar({ holdings, total }: { holdings: Result[]; total: number }) {
  const valid = holdings.filter(h => !h.error && h.current_value > 0)
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-px">
      {valid.map(h => (
        <div key={h.ticker} className="h-full transition-all duration-700"
          style={{ width: `${(h.current_value / total * 100).toFixed(1)}%`, background: COLORS[h.ticker] ?? COLORS.default }} />
      ))}
    </div>
  )
}

export default function Home() {
  const { remaining, increment, isLimited } = useRateLimit('wealthpilot-usage', 3)
  const [holdings, setHoldings] = useState<Holding[]>([{ ticker: '', shares: '', buyPrice: '' }])
  const [result, setResult] = useState<PortfolioResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertTicker, setAlertTicker] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [alertDir, setAlertDir] = useState<'above' | 'below'>('above')
  const [tab, setTab] = useState<'holdings' | 'allocation' | 'insights' | 'alerts'>('holdings')
  const [time, setTime] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wealthpilot-history')
      if (saved) setHistory(JSON.parse(saved))
      const savedAlerts = localStorage.getItem('wealthpilot-alerts')
      if (savedAlerts) setAlerts(JSON.parse(savedAlerts))
    } catch { /* ignore */ }
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const addRow = () => setHoldings(h => [...h, { ticker: '', shares: '', buyPrice: '' }])
  const removeRow = (i: number) => setHoldings(h => h.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: keyof Holding, val: string) =>
    setHoldings(h => h.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  async function analyze() {
    const valid = holdings.filter(h => h.ticker && h.shares && h.buyPrice)
    if (!valid.length) return
    if (isLimited) return
    increment()
    setLoading(true)
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: valid.map(h => ({ ticker: h.ticker.toUpperCase(), shares: parseFloat(h.shares), buy_price: parseFloat(h.buyPrice) })), question }),
      })
      const data = await res.json()
      setResult(data)
      if (data.total_value > 0) {
        const entry: HistoryEntry = { date: new Date().toISOString().split('T')[0], value: data.total_value, cost: data.total_cost }
        const newHistory = [...history.filter(h => h.date !== entry.date), entry].slice(-30)
        setHistory(newHistory)
        localStorage.setItem('wealthpilot-history', JSON.stringify(newHistory))
      }
      if (data.holdings) {
        const updatedAlerts = alerts.map(a => {
          const holding = data.holdings.find((h: Result) => h.ticker === a.ticker)
          if (!holding) return a
          return { ...a, triggered: a.direction === 'above' ? holding.current_price >= a.targetPrice : holding.current_price <= a.targetPrice }
        })
        setAlerts(updatedAlerts)
        localStorage.setItem('wealthpilot-alerts', JSON.stringify(updatedAlerts))
      }
      setTab('holdings')
    } finally { setLoading(false) }
  }

  function addAlert() {
    if (!alertTicker || !alertPrice) return
    const newAlerts = [...alerts, { ticker: alertTicker.toUpperCase(), targetPrice: parseFloat(alertPrice), direction: alertDir }]
    setAlerts(newAlerts)
    localStorage.setItem('wealthpilot-alerts', JSON.stringify(newAlerts))
    setAlertTicker(''); setAlertPrice('')
  }

  const triggeredAlerts = alerts.filter(a => a.triggered)
  const inp = 'w-full bg-black border border-green-900/60 rounded px-3 py-2 text-sm text-green-300 placeholder-green-900 focus:outline-none focus:border-green-500/60 transition-all font-mono uppercase'
  const inpNum = 'w-full bg-black border border-green-900/60 rounded px-3 py-2 text-sm text-green-300 placeholder-green-900 focus:outline-none focus:border-green-500/60 transition-all font-mono'

  return (
    <main className="min-h-screen relative z-10">
      {/* Noise overlay */}
      <div className="noise-overlay" aria-hidden="true" />
      {/* Ambient orbs */}
      <div className="orb orb-1" style={{ background: 'radial-gradient(circle, rgba(0,255,100,0.10), transparent 70%)', top: '-100px', left: '-50px' }} aria-hidden="true" />
      <div className="orb orb-2" style={{ background: 'radial-gradient(circle, rgba(0,212,170,0.08), transparent 70%)', animationDelay: '-8s' }} aria-hidden="true" />

      {/* Top status bar — AI Bloomberg Terminal */}
      <div className="border-b border-green-900/40 bg-black py-1 px-4 flex items-center justify-between text-[10px] font-mono overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-bold">▶ NYSE OPEN</span>
          </div>
          <span className="text-green-900">|</span>
          <span className="text-green-700">NASDAQ</span>
          <span className="text-green-900">|</span>
          <span className="text-green-800">16:42:03 UTC</span>
        </div>
        <div className="hidden sm:block">
          <span className="text-green-600 font-bold tracking-widest">WEALTHPILOT v2</span>
        </div>
        <div className="flex items-center gap-4 text-green-700">
          {triggeredAlerts.length > 0 && (
            <span className="text-amber-400 animate-pulse">⚡ {triggeredAlerts.length} ALERT{triggeredAlerts.length > 1 ? 'S' : ''}</span>
          )}
          <a href="#pricing" className="text-green-400 font-bold border border-green-900/60 px-2 py-0.5 rounded hover:border-green-500/40 transition-all">
            UPGRADE PRO
          </a>
        </div>
      </div>

      {/* Nav — Terminal main nav */}
      <nav className="border-b border-green-900/40 bg-black/80 backdrop-blur-xl px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded flex items-center justify-center font-mono font-black text-sm border border-green-500/40" style={{ background: 'rgba(0,255,100,0.08)', color: '#00ff64' }}>WP</div>
            <div>
              <div className="font-mono font-bold text-sm tracking-widest text-white">WEALTHPILOT</div>
              <div className="text-[9px] font-mono text-white/30">AI Portfolio Intelligence</div>
            </div>
          </div>
          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1 ml-4">
            {['HOLDINGS', 'ANALYSIS', 'ALERTS'].map(link => (
              <a key={link} href="#how"
                className="px-3 py-1.5 text-[11px] font-mono font-bold text-white/50 hover:text-green-400 transition-colors tracking-widest relative group">
                {link}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-green-400 group-hover:w-full transition-all duration-200" />
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          {remaining < 3 && !isLimited && (
            <span className="text-amber-600">[{remaining} LEFT]</span>
          )}
          <a href="#pricing"
            className="px-3 py-1.5 border border-green-500/50 text-green-400 font-mono text-xs font-bold hover:bg-green-950/60 transition-all rounded tracking-widest">
            RUN ANALYSIS
          </a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 pt-4 pb-16">
        {/* Ticker tape */}
        <div className="border border-green-900/40 rounded mb-4 overflow-hidden bg-black/60 py-1.5">
          <div className="whitespace-nowrap font-mono text-[11px] text-green-600 animate-marquee">
            <span className="inline-block px-8">
              AAPL <span className="text-green-400">+1.2%</span> &nbsp;·&nbsp; MSFT <span className="text-green-400">+0.8%</span> &nbsp;·&nbsp; GOOGL <span className="text-red-400">-0.3%</span> &nbsp;·&nbsp; AMZN <span className="text-green-400">+2.1%</span> &nbsp;·&nbsp; TSLA <span className="text-red-400">-1.5%</span> &nbsp;·&nbsp; NVDA <span className="text-green-400">+3.4%</span> &nbsp;·&nbsp; META <span className="text-green-400">+0.6%</span> &nbsp;·&nbsp; JPM <span className="text-red-400">-0.2%</span> &nbsp;·&nbsp; NFLX <span className="text-green-400">+1.8%</span> &nbsp;·&nbsp; AAPL <span className="text-green-400">+1.2%</span> &nbsp;·&nbsp; MSFT <span className="text-green-400">+0.8%</span> &nbsp;·&nbsp; GOOGL <span className="text-red-400">-0.3%</span> &nbsp;·&nbsp; AMZN <span className="text-green-400">+2.1%</span> &nbsp;·&nbsp; TSLA <span className="text-red-400">-1.5%</span> &nbsp;·&nbsp;
            </span>
          </div>
        </div>

        {/* Hero header */}
        <div className="mb-6 border border-green-900/40 rounded bg-black/40 px-5 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] text-green-700 font-mono mb-2">// PORTFOLIO ANALYSIS SYSTEM v2.1</div>
              <h1 className="text-4xl md:text-5xl font-black font-mono tracking-tight leading-none mb-3" style={{ background: 'linear-gradient(135deg, #00ff64, #00d4aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PORTFOLIO<br />INTELLIGENCE
              </h1>
              {/* Status row */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: 'LIVE PRICES', color: '#00ff64', bg: 'rgba(0,255,100,0.08)', border: 'rgba(0,255,100,0.25)' },
                  { label: 'AI ANALYSIS', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
                  { label: 'SMART ALERTS', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' },
                ].map(s => (
                  <div key={s.label} className="px-3 py-1.5 rounded font-mono text-[11px] font-bold tracking-widest"
                    style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                    ● {s.label}
                  </div>
                ))}
              </div>
            </div>
            {result && (
              <div className="text-right hidden md:block">
                <div className="text-[10px] text-green-700 font-mono">TOTAL VALUE</div>
                <div className="text-2xl font-black font-mono text-green-400">${result.total_value.toLocaleString()}</div>
                <div className={`text-sm font-mono font-bold ${result.total_gain_loss_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {result.total_gain_loss_pct >= 0 ? '▲' : '▼'} {Math.abs(result.total_gain_loss_pct).toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Input panel */}
          <div className="lg:col-span-2 space-y-3">
            {/* Holdings input */}
            <div className="border border-green-900/40 rounded bg-black/60">
              <div className="border-b border-green-900/30 px-4 py-2 flex items-center justify-between">
                <span className="text-[11px] font-mono text-green-600 uppercase tracking-wider">► HOLDINGS INPUT</span>
                <span className="text-[10px] text-green-900 font-mono">{holdings.filter(h => h.ticker).length} positions</span>
              </div>
              <div className="p-4 space-y-2">
                <div className="grid grid-cols-3 gap-2 px-1 pb-1">
                  {['TICKER', 'SHARES', 'BUY $'].map(l => (
                    <span key={l} className="text-[9px] text-green-900 uppercase tracking-widest font-mono">{l}</span>
                  ))}
                </div>
                {holdings.map((h, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2">
                    <input value={h.ticker} onChange={e => updateRow(i, 'ticker', e.target.value.toUpperCase())}
                      placeholder="AAPL" className={inp} />
                    <input value={h.shares} onChange={e => updateRow(i, 'shares', e.target.value)}
                      placeholder="10" type="number" className={inpNum} />
                    <div className="relative">
                      <input value={h.buyPrice} onChange={e => updateRow(i, 'buyPrice', e.target.value)}
                        placeholder="150" type="number" className={inpNum + ' pr-6'} />
                      {holdings.length > 1 && (
                        <button onClick={() => removeRow(i)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-green-900 hover:text-red-500 transition-colors text-xs">✕</button>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={addRow}
                  className="w-full py-1.5 border border-dashed border-green-900/50 text-[10px] text-green-800 hover:text-green-600 hover:border-green-700/50 font-mono transition-all mt-1">
                  + ADD_POSITION()
                </button>
              </div>
            </div>

            {/* AI Query */}
            <div className="border border-green-900/40 rounded bg-black/60 p-4">
              <div className="text-[9px] text-green-800 font-mono uppercase tracking-widest mb-2">► AI QUERY (OPTIONAL)</div>
              <input value={question} onChange={e => setQuestion(e.target.value)}
                placeholder="Should I rebalance? Overexposed to tech?"
                className="w-full bg-black border border-green-900/50 rounded px-3 py-2 text-xs text-green-300 placeholder-green-900 focus:outline-none focus:border-green-500/60 transition-all font-mono" />
            </div>

            {/* Run button */}
            <button onClick={analyze} disabled={loading || isLimited}
              className={`w-full py-3.5 border font-mono font-bold text-sm transition-all rounded flex items-center justify-center gap-2 tracking-widest disabled:opacity-40 terminal-glow ${isLimited ? 'border-amber-600/40 bg-amber-950/30 text-amber-500 cursor-not-allowed' : 'border-green-500/50 bg-green-950/40 hover:bg-green-950/80 text-green-400 hover:text-green-300'}`}>
              {loading ? (
                <><span className="blink">█</span> FETCHING LIVE DATA...</>
              ) : isLimited ? (
                '⚡ DAILY LIMIT REACHED — UPGRADE FOR UNLIMITED'
              ) : (
                <>► RUN ANALYSIS() <span className="text-green-800 text-[10px]">[{remaining} left today]</span></>
              )}
            </button>

            {/* Alerts panel */}
            <div className="border border-green-900/40 rounded bg-black/60">
              <div className="border-b border-green-900/30 px-4 py-2">
                <span className="text-[11px] font-mono text-green-600 uppercase tracking-wider">► PRICE ALERTS</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <input value={alertTicker} onChange={e => setAlertTicker(e.target.value.toUpperCase())}
                    placeholder="AAPL" className="w-16 bg-black border border-green-900/60 rounded px-2 py-1.5 text-xs text-green-300 placeholder-green-900 focus:outline-none focus:border-green-500/60 font-mono uppercase" />
                  <select value={alertDir} onChange={e => setAlertDir(e.target.value as 'above' | 'below')}
                    className="bg-black border border-green-900/60 rounded px-2 py-1.5 text-xs text-green-600 focus:outline-none font-mono">
                    <option value="above">↑ ABOVE</option>
                    <option value="below">↓ BELOW</option>
                  </select>
                  <input value={alertPrice} onChange={e => setAlertPrice(e.target.value)}
                    placeholder="200" type="number"
                    className="flex-1 bg-black border border-green-900/60 rounded px-2 py-1.5 text-xs text-green-300 placeholder-green-900 focus:outline-none focus:border-green-500/60 font-mono" />
                  <button onClick={addAlert}
                    className="px-2.5 py-1.5 border border-amber-600/40 bg-amber-950/30 text-amber-500 text-xs font-mono hover:bg-amber-950/60 transition-all rounded">SET</button>
                </div>
                {alerts.length > 0 ? (
                  <div className="space-y-1">
                    {alerts.map((a, i) => (
                      <div key={i} className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-[11px] font-mono ${a.triggered ? 'border-amber-600/40 bg-amber-950/20 text-amber-400' : 'border-green-900/30 text-green-700'}`}>
                        <span className="font-bold">{a.ticker}</span>
                        <span>{a.direction === 'above' ? '↑' : '↓'} ${a.targetPrice}</span>
                        {a.triggered && <span className="text-amber-400">⚡ HIT</span>}
                        <button onClick={() => { const n = alerts.filter((_, j) => j !== i); setAlerts(n); localStorage.setItem('wealthpilot-alerts', JSON.stringify(n)) }}
                          className="text-green-900 hover:text-red-500 transition-colors">✕</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-green-900 font-mono text-center py-1">NO ALERTS SET</p>
                )}
              </div>
            </div>
          </div>

          {/* Results panel */}
          <div className="lg:col-span-3 space-y-3">
            {result ? (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'PORTFOLIO VALUE', value: `$${result.total_value.toLocaleString()}`, sub: `P&L: $${(result.total_value - result.total_cost) >= 0 ? '+' : ''}${(result.total_value - result.total_cost).toLocaleString()}`, up: true },
                    { label: 'TOTAL INVESTED', value: `$${result.total_cost.toLocaleString()}`, sub: `${result.holdings.filter(h => !h.error).length} POSITIONS`, up: null },
                    { label: 'RETURN', value: `${result.total_gain_loss_pct >= 0 ? '+' : ''}${result.total_gain_loss_pct.toFixed(2)}%`, sub: result.total_gain_loss_pct >= 0 ? 'PROFITABLE ▲' : 'IN LOSS ▼', up: result.total_gain_loss_pct >= 0 },
                  ].map(s => (
                    <div key={s.label} className="border border-green-900/40 rounded bg-black/60 px-3 py-3">
                      <div className="text-[9px] text-green-800 font-mono uppercase tracking-widest mb-1">{s.label}</div>
                      <div className={`text-lg font-black font-mono ${s.up === null ? 'text-green-300' : s.up ? 'text-green-400' : 'text-red-400'}`}>{s.value}</div>
                      <div className={`text-[9px] font-mono mt-0.5 ${s.up === null ? 'text-green-800' : s.up ? 'text-green-700' : 'text-red-800'}`}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Allocation bar */}
                <div className="border border-green-900/40 rounded bg-black/60 px-4 py-3">
                  <div className="text-[9px] text-green-800 font-mono mb-2">ALLOCATION DISTRIBUTION</div>
                  <AllocationBar holdings={result.holdings} total={result.total_value} />
                  <div className="flex flex-wrap gap-3 mt-2">
                    {result.holdings.filter(h => !h.error).map(h => (
                      <div key={h.ticker} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm" style={{ background: COLORS[h.ticker] ?? COLORS.default }} />
                        <span className="text-[9px] font-mono text-green-700">{h.ticker} {(h.current_value / result.total_value * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-0 border border-green-900/40 rounded overflow-hidden font-mono text-[11px]">
                  {[
                    { id: 'holdings', label: '[ POSITIONS ]' },
                    { id: 'allocation', label: '[ HISTORY ]' },
                    { id: 'insights', label: '[ AI ANALYSIS ]' },
                    { id: 'alerts', label: `[ ALERTS${triggeredAlerts.length > 0 ? ` ⚡${triggeredAlerts.length}` : ''} ]` },
                  ].map((t, i) => (
                    <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                      className={`flex-1 py-2 transition-all border-r border-green-900/40 last:border-0 tracking-wider ${tab === t.id ? 'bg-green-950/60 text-green-400' : 'text-green-800 hover:text-green-600 hover:bg-green-950/20'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Holdings table */}
                {tab === 'holdings' && (
                  <div className="border border-green-900/40 rounded overflow-hidden bg-black/40">
                    <div className="grid grid-cols-12 px-4 py-2 border-b border-green-900/30 text-[9px] text-green-800 font-mono uppercase tracking-widest">
                      <span className="col-span-3">TICKER</span>
                      <span className="col-span-2 text-right">CUR PRICE</span>
                      <span className="col-span-2 text-right">VALUE</span>
                      <span className="col-span-2 text-right">RETURN</span>
                      <span className="col-span-3 text-right">ALLOC</span>
                    </div>
                    {result.holdings.filter(h => !h.error).map(h => {
                      const alloc = (h.current_value / result.total_value * 100).toFixed(1)
                      const color = COLORS[h.ticker] ?? COLORS.default
                      return (
                        <div key={h.ticker} className="border-b border-green-900/20 last:border-0 hover:bg-green-950/10 transition-colors">
                          <div className="grid grid-cols-12 px-4 py-3 items-center">
                            <div className="col-span-3 flex items-center gap-2">
                              <div className="w-1 h-6 rounded-full" style={{ background: color }} />
                              <span className="font-mono font-bold text-sm" style={{ color }}>{h.ticker}</span>
                            </div>
                            <span className="col-span-2 text-right text-xs font-mono text-green-500">${h.current_price.toFixed(2)}</span>
                            <span className="col-span-2 text-right text-xs font-mono text-white">${h.current_value.toLocaleString()}</span>
                            <span className={`col-span-2 text-right text-xs font-mono font-bold ${h.gain_loss_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {h.gain_loss_pct >= 0 ? '+' : ''}{h.gain_loss_pct.toFixed(2)}%
                            </span>
                            <div className="col-span-3 flex items-center justify-end gap-2">
                              <div className="flex-1 h-1 bg-green-950 rounded overflow-hidden max-w-12">
                                <div className="h-full rounded transition-all" style={{ width: `${alloc}%`, background: color }} />
                              </div>
                              <span className="text-[10px] font-mono text-green-800">{alloc}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* History tab */}
                {tab === 'allocation' && (
                  <div className="border border-green-900/40 rounded bg-black/60 p-4">
                    <div className="text-[9px] text-green-800 font-mono mb-3">PORTFOLIO VALUE HISTORY (30 DAY)</div>
                    {history.length >= 2 ? (
                      <>
                        <MiniSparkline history={history} />
                        <div className="mt-3 space-y-1">
                          {history.slice(-5).reverse().map((h, i) => (
                            <div key={i} className="flex justify-between text-[10px] font-mono border-b border-green-900/20 pb-1">
                              <span className="text-green-800">{h.date}</span>
                              <span className="text-green-500">${h.value.toLocaleString()}</span>
                              <span className={`${h.value >= h.cost ? 'text-green-700' : 'text-red-800'}`}>
                                {h.value >= h.cost ? '+' : ''}{((h.value - h.cost) / h.cost * 100).toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-green-900 font-mono">RUN ANALYSIS MULTIPLE TIMES TO BUILD HISTORY LOG</p>
                    )}
                  </div>
                )}

                {/* AI insights tab */}
                {tab === 'insights' && (
                  <div className="border border-green-500/20 rounded bg-black/60 p-4">
                    {result.insights ? (
                      <>
                        <div className="text-[9px] text-green-600 font-mono mb-3 flex items-center gap-2">
                          <span className="blink">█</span> CLAUDE AI PORTFOLIO ANALYSIS OUTPUT
                        </div>
                        <p className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap">{result.insights}</p>
                      </>
                    ) : (
                      <p className="text-xs text-green-900 font-mono">NO AI INSIGHTS — CHECK API KEY CONFIGURATION</p>
                    )}
                  </div>
                )}

                {/* Alerts tab */}
                {tab === 'alerts' && (
                  <div className="border border-green-900/40 rounded bg-black/60 p-4">
                    <div className="text-[9px] text-green-800 font-mono mb-3">ALERT STATUS LOG</div>
                    {alerts.length > 0 ? (
                      <div className="space-y-2">
                        {alerts.map((a, i) => {
                          const holding = result.holdings.find(h => h.ticker === a.ticker)
                          return (
                            <div key={i} className={`border rounded px-3 py-2 font-mono text-xs flex items-center justify-between ${a.triggered ? 'border-amber-600/40 bg-amber-950/20 text-amber-400' : 'border-green-900/30 text-green-700'}`}>
                              <span className="font-bold">{a.ticker}</span>
                              <span>{a.direction === 'above' ? '↑ ABOVE' : '↓ BELOW'} ${a.targetPrice}</span>
                              {holding && <span>CUR: ${holding.current_price.toFixed(2)}</span>}
                              <span>{a.triggered ? '⚡ TRIGGERED' : '○ WATCHING'}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-green-900 font-mono">NO ACTIVE ALERTS</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="border border-green-900/30 rounded bg-black/30 flex flex-col items-center justify-center py-24 gap-4">
                <div className="font-mono text-green-900 text-xs space-y-1 text-center">
                  <p className="text-green-600">WEALTHPILOT TERMINAL</p>
                  <p>══════════════════════════════</p>
                  <p>AWAITING INPUT...</p>
                  <p>ADD HOLDINGS TO BEGIN ANALYSIS</p>
                  <p>══════════════════════════════</p>
                  <p className="text-[10px]">POWERED BY YAHOO FINANCE + CLAUDE AI</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <section id="pricing" className="border-t border-green-900/30 mt-8 px-4 pb-16">
        <div className="max-w-3xl mx-auto pt-12">
          <div className="text-center mb-8">
            <div className="text-[10px] text-green-700 font-mono mb-2">// PRICING MODULE</div>
            <h2 className="text-2xl font-black font-mono text-green-400">WEALTHPILOT.PLANS[]</h2>
            <p className="text-xs text-green-800 mt-2">Free forever for basics · Pro for serious investors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-green-900/40 rounded overflow-hidden">
            {[
              { name: 'FREE', price: '$0', sub: 'forever', features: ['3 analyses / day', 'Live price data', 'AI portfolio insights', 'Price alerts (localStorage)', 'Portfolio history (30 days)', 'Allocation charts'], cta: 'Current plan', highlight: false },
              { name: 'PRO', price: '$7', sub: '/ month', features: ['Unlimited analyses', 'Email price alerts', 'Export to CSV / PDF', 'Multi-portfolio support', 'AI rebalancing suggestions', 'Priority support'], cta: 'Upgrade to Pro →', highlight: true },
            ].map(plan => (
              <div key={plan.name} className={`p-8 ${plan.highlight ? 'bg-green-950/40' : 'bg-black/60'}`}>
                <div className="text-[10px] font-mono text-green-700 mb-1">{plan.highlight ? '// RECOMMENDED' : '// STARTER'}</div>
                <div className={`text-3xl font-black font-mono mb-0.5 ${plan.highlight ? 'text-green-400' : 'text-green-700'}`}>{plan.price}</div>
                <div className="text-xs text-green-900 font-mono mb-6">{plan.sub}</div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-xs font-mono ${plan.highlight ? 'text-green-600' : 'text-green-900'}`}>
                      <span className={plan.highlight ? 'text-green-500' : 'text-green-800'}>►</span> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-2.5 rounded text-xs font-mono font-bold transition-all ${plan.highlight ? 'border border-green-500/50 text-green-400 hover:bg-green-950/80' : 'border border-green-900/50 text-green-900 cursor-default'}`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
