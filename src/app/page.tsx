'use client'
import { useState, useEffect } from 'react'

interface Holding { ticker: string; shares: string; buyPrice: string }
interface Result { ticker: string; shares: number; buy_price: number; current_price: number; current_value: number; gain_loss_pct: number; error?: string; prevValue?: number }
interface HistoryEntry { date: string; value: number; cost: number }
interface PortfolioResult { holdings: Result[]; total_value: number; total_cost: number; total_gain_loss_pct: number; insights?: string; news?: NewsItem[] }
interface NewsItem { ticker: string; headline: string; url: string; source: string }
interface Alert { ticker: string; targetPrice: number; direction: 'above' | 'below'; triggered?: boolean }

const COLORS: Record<string, string> = {
  AAPL:'#6366f1', MSFT:'#0ea5e9', GOOGL:'#f59e0b', AMZN:'#f97316',
  TSLA:'#ef4444', META:'#3b82f6', NVDA:'#8b5cf6', NFLX:'#ef4444',
  JPM:'#0ea5e9', BRK:'#f59e0b', default: '#10b981',
}

function MiniChart({ history }: { history: HistoryEntry[] }) {
  if (history.length < 2) return null
  const vals = history.map(h => h.value)
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1
  const w = 200, h = 50
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
  const color = vals[vals.length - 1] >= vals[0] ? '#10b981' : '#ef4444'
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function PieChart({ holdings }: { holdings: Result[] }) {
  const valid = holdings.filter(h => !h.error && h.current_value > 0)
  if (valid.length === 0) return null
  const total = valid.reduce((s, h) => s + h.current_value, 0)
  let cumulAngle = 0
  const slices = valid.map(h => {
    const pct = h.current_value / total
    const angle = pct * 2 * Math.PI
    const start = cumulAngle
    cumulAngle += angle
    return { ...h, pct, startAngle: start, endAngle: cumulAngle }
  })
  const r = 60, cx = 70, cy = 70
  function arc(s: typeof slices[0]) {
    const x1 = cx + r * Math.cos(s.startAngle - Math.PI / 2)
    const y1 = cy + r * Math.sin(s.startAngle - Math.PI / 2)
    const x2 = cx + r * Math.cos(s.endAngle - Math.PI / 2)
    const y2 = cy + r * Math.sin(s.endAngle - Math.PI / 2)
    const large = s.endAngle - s.startAngle > Math.PI ? 1 : 0
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
  }
  return (
    <div className="flex items-center gap-4">
      <svg width={140} height={140}>
        {slices.map((s, i) => (
          <path key={i} d={arc(s)} fill={COLORS[s.ticker] ?? COLORS.default} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={30} fill="#0a0f0a" />
      </svg>
      <div className="space-y-1.5">
        {slices.map(s => (
          <div key={s.ticker} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[s.ticker] ?? COLORS.default }} />
            <span className="text-xs text-white/70">{s.ticker}</span>
            <span className="text-xs text-white/40">{(s.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [holdings, setHoldings] = useState<Holding[]>([{ ticker: '', shares: '', buyPrice: '' }])
  const [result, setResult] = useState<PortfolioResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertTicker, setAlertTicker] = useState('')
  const [alertPrice, setAlertPrice] = useState('')
  const [alertDir, setAlertDir] = useState<'above' | 'below'>('above')
  const [tab, setTab] = useState<'holdings' | 'chart' | 'alerts' | 'news'>('holdings')

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wealthpilot-history')
      if (saved) setHistory(JSON.parse(saved))
      const savedAlerts = localStorage.getItem('wealthpilot-alerts')
      if (savedAlerts) setAlerts(JSON.parse(savedAlerts))
    } catch { /* ignore */ }
  }, [])

  const addRow = () => setHoldings(h => [...h, { ticker: '', shares: '', buyPrice: '' }])
  const removeRow = (i: number) => setHoldings(h => h.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: keyof Holding, val: string) =>
    setHoldings(h => h.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  async function analyze() {
    const valid = holdings.filter(h => h.ticker && h.shares && h.buyPrice)
    if (!valid.length) return
    setLoading(true)
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: valid.map(h => ({ ticker: h.ticker.toUpperCase(), shares: parseFloat(h.shares), buy_price: parseFloat(h.buyPrice) })), question }),
      })
      const data = await res.json()
      setResult(data)

      // Save portfolio value to history
      if (data.total_value > 0) {
        const entry: HistoryEntry = { date: new Date().toISOString().split('T')[0], value: data.total_value, cost: data.total_cost }
        const newHistory = [...history.filter(h => h.date !== entry.date), entry].slice(-30)
        setHistory(newHistory)
        localStorage.setItem('wealthpilot-history', JSON.stringify(newHistory))
      }

      // Check alerts
      if (data.holdings) {
        const updatedAlerts = alerts.map(a => {
          const holding = data.holdings.find((h: Result) => h.ticker === a.ticker)
          if (!holding) return a
          const triggered = a.direction === 'above' ? holding.current_price >= a.targetPrice : holding.current_price <= a.targetPrice
          return { ...a, triggered }
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

  const input = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 transition-all'

  const triggeredAlerts = alerts.filter(a => a.triggered)

  return (
    <main className="min-h-screen">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full bg-emerald-600/15 blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <nav className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center font-bold text-sm">W</div>
            <span className="font-semibold text-lg tracking-tight">WealthPilot</span>
          </div>
          <div className="flex items-center gap-3">
            {triggeredAlerts.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
                🔔 {triggeredAlerts.length} alert{triggeredAlerts.length > 1 ? 's' : ''} triggered
              </div>
            )}
            <span className="text-xs text-emerald-400/70 hidden sm:block">● Live market data</span>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-sm font-medium transition-all">
              Get started free
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-10 pb-24">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Real-time prices · AI insights · Price alerts · Portfolio history
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Your portfolio,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">analyzed by AI</span>
          </h1>
          <p className="text-white/50 max-w-2xl">Live prices from Yahoo Finance · AI risk analysis · Set price alerts · Track value over time</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
              <h2 className="font-semibold text-base mb-1">Holdings</h2>
              <p className="text-xs text-white/40 mb-4">Ticker · Shares · Avg buy price</p>

              <div className="space-y-2 mb-3">
                <div className="grid grid-cols-3 gap-2 px-1">
                  {['Ticker', 'Shares', 'Buy $'].map(l => (
                    <span key={l} className="text-[10px] text-white/25 uppercase tracking-wider">{l}</span>
                  ))}
                </div>
                {holdings.map((h, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 group relative">
                    <input value={h.ticker} onChange={e => updateRow(i, 'ticker', e.target.value.toUpperCase())} placeholder="AAPL" className={input + ' uppercase font-mono'} />
                    <input value={h.shares} onChange={e => updateRow(i, 'shares', e.target.value)} placeholder="10" type="number" className={input} />
                    <div className="relative">
                      <input value={h.buyPrice} onChange={e => updateRow(i, 'buyPrice', e.target.value)} placeholder="150" type="number" className={input + ' pr-7'} />
                      {holdings.length > 1 && (
                        <button onClick={() => removeRow(i)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-red-400 transition-colors text-xs">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={addRow} className="w-full py-2 rounded-xl border border-dashed border-white/10 hover:border-white/20 text-xs text-white/30 hover:text-white/60 transition-all mb-4">
                + Add holding
              </button>

              <div className="mb-4">
                <label className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5 block">Ask AI anything about your portfolio</label>
                <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Should I rebalance? Am I overexposed to tech?" className={input} />
              </div>

              <button onClick={analyze} disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Fetching live prices...</>
                ) : 'Analyze portfolio ✦'}
              </button>
            </div>

            {/* Price Alerts */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">🔔 Price Alerts</h3>
              <div className="flex gap-2 mb-3">
                <input value={alertTicker} onChange={e => setAlertTicker(e.target.value.toUpperCase())} placeholder="AAPL" className="w-20 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white uppercase placeholder-white/25 focus:outline-none focus:border-amber-500/50 transition-all font-mono" />
                <select value={alertDir} onChange={e => setAlertDir(e.target.value as 'above' | 'below')} className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/70 focus:outline-none flex-shrink-0">
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
                <input value={alertPrice} onChange={e => setAlertPrice(e.target.value)} placeholder="200" type="number" className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50 transition-all" />
                <button onClick={addAlert} className="px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-all">Set</button>
              </div>
              {alerts.length > 0 ? (
                <div className="space-y-1.5">
                  {alerts.map((a, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${a.triggered ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-white/[0.02] border border-white/5'}`}>
                      <span className={`font-mono font-semibold ${a.triggered ? 'text-amber-300' : 'text-white/70'}`}>{a.ticker}</span>
                      <span className="text-white/40">{a.direction === 'above' ? '↑' : '↓'} ${a.targetPrice}</span>
                      {a.triggered && <span className="text-amber-400 font-semibold">🔔 Hit!</span>}
                      <button onClick={() => { const n = alerts.filter((_, j) => j !== i); setAlerts(n); localStorage.setItem('wealthpilot-alerts', JSON.stringify(n)) }} className="text-white/20 hover:text-red-400 transition-colors">✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/25 text-center py-2">No alerts set — add one above</p>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            {result ? (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Portfolio Value', value: `$${result.total_value.toLocaleString()}`, sub: `+$${(result.total_value - result.total_cost).toLocaleString()} P&L`, color: 'text-white' },
                    { label: 'Total Invested', value: `$${result.total_cost.toLocaleString()}`, sub: `${result.holdings.filter(h => !h.error).length} positions`, color: 'text-white/70' },
                    { label: 'Total Return', value: `${result.total_gain_loss_pct >= 0 ? '+' : ''}${result.total_gain_loss_pct.toFixed(2)}%`, sub: result.total_gain_loss_pct >= 0 ? '📈 Profitable' : '📉 In loss', color: result.total_gain_loss_pct >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-[10px] text-white/35 mb-1">{s.label}</div>
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-white/30 mt-0.5">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
                  {[
                    { id: 'holdings', label: '📊 Holdings' },
                    { id: 'chart', label: '📈 Chart' },
                    { id: 'news', label: '📰 AI Insights' },
                    { id: 'alerts', label: `🔔 Alerts${triggeredAlerts.length > 0 ? ` (${triggeredAlerts.length})` : ''}` },
                  ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-white/[0.08] text-white' : 'text-white/40 hover:text-white/70'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Holdings tab */}
                {tab === 'holdings' && (
                  <div className="rounded-2xl border border-white/10 overflow-hidden">
                    <div className="grid grid-cols-5 px-5 py-2.5 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-wider">
                      <span className="col-span-2">Ticker</span><span className="text-right">Price</span><span className="text-right">Value</span><span className="text-right">Return</span>
                    </div>
                    {result.holdings.filter(h => !h.error).map(h => {
                      const color = COLORS[h.ticker] ?? COLORS.default
                      const alloc = (h.current_value / result.total_value * 100).toFixed(0)
                      return (
                        <div key={h.ticker} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <div className="grid grid-cols-5 px-5 py-3.5 items-center">
                            <div className="col-span-2 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white" style={{ background: color }}>
                                {h.ticker.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-semibold text-sm">{h.ticker}</div>
                                <div className="text-[10px] text-white/30">{alloc}% of portfolio</div>
                              </div>
                            </div>
                            <span className="text-right text-sm text-white/60">${h.current_price.toFixed(2)}</span>
                            <span className="text-right text-sm font-medium">${h.current_value.toLocaleString()}</span>
                            <span className={`text-right text-sm font-bold ${h.gain_loss_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {h.gain_loss_pct >= 0 ? '+' : ''}{h.gain_loss_pct.toFixed(2)}%
                            </span>
                          </div>
                          {/* Allocation bar */}
                          <div className="px-5 pb-2">
                            <div className="h-0.5 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${alloc}%`, background: color }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Chart tab */}
                {tab === 'chart' && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Portfolio value history</h3>
                      {history.length >= 2 ? (
                        <div>
                          <MiniChart history={history} />
                          <div className="flex justify-between text-[10px] text-white/30 mt-2">
                            <span>{history[0]?.date}</span>
                            <span>{history[history.length - 1]?.date}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-white/30">Analyze your portfolio multiple times to build history. Each analysis saves a data point.</p>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold mb-4">Allocation breakdown</h3>
                      <PieChart holdings={result.holdings} />
                    </div>
                  </div>
                )}

                {/* AI Insights tab */}
                {tab === 'news' && result.insights && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">✦</div>
                      <h3 className="font-semibold">AI Portfolio Analysis</h3>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{result.insights}</p>
                  </div>
                )}

                {/* Alerts tab */}
                {tab === 'alerts' && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <h3 className="font-semibold mb-4">Price Alert Status</h3>
                    {alerts.length > 0 ? (
                      <div className="space-y-2">
                        {alerts.map((a, i) => {
                          const holding = result.holdings.find(h => h.ticker === a.ticker)
                          const current = holding?.current_price
                          return (
                            <div key={i} className={`rounded-xl p-4 border ${a.triggered ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/[0.03] border-white/10'}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-mono font-bold">{a.ticker}</span>
                                  <span className="text-white/40 text-sm ml-2">{a.direction === 'above' ? '↑ above' : '↓ below'} ${a.targetPrice}</span>
                                </div>
                                <div className="text-right">
                                  {current && <div className="text-sm text-white/60">Current: ${current.toFixed(2)}</div>}
                                  {a.triggered && <div className="text-amber-400 text-xs font-semibold mt-0.5">🔔 Alert triggered!</div>}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-white/30 text-center py-4">Set price alerts in the panel on the left</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-32 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">📈</div>
                <p className="text-white/30 text-sm text-center max-w-xs">Add your holdings and analyze to see live performance, AI insights, and allocation charts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
