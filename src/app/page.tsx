'use client'
import { useState } from 'react'

interface Holding { ticker: string; shares: string; buyPrice: string }
interface Result { ticker: string; shares: number; buy_price: number; current_price: number; current_value: number; gain_loss_pct: number; error?: string }
interface PortfolioResult { holdings: Result[]; total_value: number; total_cost: number; total_gain_loss_pct: number; insights?: string }

const COLORS: Record<string, string> = {
  AAPL:'#6366f1', MSFT:'#0ea5e9', GOOGL:'#f59e0b', AMZN:'#f97316',
  TSLA:'#ef4444', META:'#3b82f6', NVDA:'#8b5cf6', default: '#10b981',
}

export default function Home() {
  const [holdings, setHoldings] = useState<Holding[]>([
    { ticker: '', shares: '', buyPrice: '' },
  ])
  const [result, setResult] = useState<PortfolioResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')

  const addRow = () => setHoldings(h => [...h, { ticker: '', shares: '', buyPrice: '' }])
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
      setResult(await res.json())
    } finally { setLoading(false) }
  }

  const input = 'w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 transition-all'

  return (
    <main className="min-h-screen">
      {/* Ambient */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full bg-emerald-600/15 blur-[130px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Nav */}
      <nav className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center font-bold text-sm">W</div>
            <span className="font-semibold text-lg tracking-tight">WealthPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-400/70 hidden sm:block">● Live market data</span>
            <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-sm font-medium transition-all">
              Get started free
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-12 pb-24">
        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-medium mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Powered by Claude AI + Yahoo Finance
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3">
            Your portfolio,{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              analyzed by AI
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl">Add your holdings. Get real-time performance data and AI-powered insights on risk, diversification, and rebalancing opportunities.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input panel */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-7">
            <h2 className="font-semibold text-lg mb-1">Add holdings</h2>
            <p className="text-sm text-white/40 mb-5">Ticker · Shares · Buy price</p>

            <div className="space-y-3 mb-4">
              {holdings.map((h, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input value={h.ticker} onChange={e => updateRow(i, 'ticker', e.target.value.toUpperCase())} placeholder="AAPL" className={input + ' uppercase'} />
                  <input value={h.shares} onChange={e => updateRow(i, 'shares', e.target.value)} placeholder="10" type="number" className={input} />
                  <input value={h.buyPrice} onChange={e => updateRow(i, 'buyPrice', e.target.value)} placeholder="150" type="number" className={input} />
                </div>
              ))}
            </div>

            <button onClick={addRow} className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-sm text-white/50 hover:text-white transition-all mb-5">
              + Add holding
            </button>

            <div className="mb-4">
              <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Ask AI something</label>
              <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Should I rebalance my tech holdings?" className={input} />
            </div>

            <button onClick={analyze} disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 font-semibold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
              ) : 'Analyze portfolio ✦'}
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-5">
            {result ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Portfolio Value', value: `$${result.total_value.toLocaleString()}`, color: 'text-white' },
                    { label: 'Total Invested', value: `$${result.total_cost.toLocaleString()}`, color: 'text-white/70' },
                    { label: 'Total Return', value: `${result.total_gain_loss_pct >= 0 ? '+' : ''}${result.total_gain_loss_pct.toFixed(2)}%`, color: result.total_gain_loss_pct >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-xs text-white/40 mb-1">{s.label}</div>
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Holdings table */}
                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  <div className="grid grid-cols-4 px-5 py-2.5 border-b border-white/5 text-[10px] text-white/30 uppercase tracking-wider">
                    <span>Ticker</span><span className="text-right">Price</span><span className="text-right">Value</span><span className="text-right">Return</span>
                  </div>
                  {result.holdings.filter(h => !h.error).map(h => {
                    const color = COLORS[h.ticker] ?? COLORS.default
                    return (
                      <div key={h.ticker} className="grid grid-cols-4 px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white" style={{ background: color }}>
                            {h.ticker.slice(0,2)}
                          </div>
                          <span className="font-semibold text-sm">{h.ticker}</span>
                        </div>
                        <span className="text-right text-sm text-white/60">${h.current_price.toFixed(2)}</span>
                        <span className="text-right text-sm">${h.current_value.toLocaleString()}</span>
                        <span className={`text-right text-sm font-semibold ${h.gain_loss_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.gain_loss_pct >= 0 ? '+' : ''}{h.gain_loss_pct.toFixed(2)}%
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* AI Insights */}
                {result.insights && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-7">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">✦</div>
                      <h3 className="font-semibold">AI Portfolio Insights</h3>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{result.insights}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-32 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">📈</div>
                <p className="text-white/30 text-sm text-center max-w-xs">Add your holdings and click analyze to see real-time performance and AI recommendations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
