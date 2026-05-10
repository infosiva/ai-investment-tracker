/**
 * lib/ai.ts — Universal AI client (canonical template)
 *
 * Fallback chain (free-first, paid last):
 *   1. Ollama    (local, 100% free) — gemma4 → qwen3.6 → llama3.2
 *   2. Groq      (cloud, free tier) — multi-key rotation
 *   3. Gemini    (cloud, free tier) — multi-key rotation
 *   4. Cerebras  (cloud, free tier)
 *   5. NVidia    (cloud, free tier) — NIM inference, Llama/Phi/Qwen/Mistral
 *   6. Kimi      (cloud, free tier) — Moonshot, best for long-context
 *   7. OpenAI    (paid, but $5 free credit on new accounts)
 *   8. Anthropic/Claude (paid, last resort)
 *
 * You always get a response — at least one provider will work at any time.
 *
 * Ollama is skipped automatically on Vercel/production (no OLLAMA_HOST means
 * it won't be reachable — falls through to Groq instantly).
 * Set OLLAMA_HOST=http://localhost:11434 in local .env to enable.
 *
 * Quality tiers:
 *   'fast'     → small/instant  — classification, short summaries
 *   'balanced' → mid-tier       — default; most tasks
 *   'best'     → largest avail  — complex reasoning, strategy
 *
 * Usage:
 *   import { callAI, aiChat, aiCached } from '@/lib/ai'
 *   const reply = await aiChat(messages)
 *   const plan  = await aiChat(messages, system, 2048, 'best')
 *
 * Capacity scaling (.env):
 *   OLLAMA_HOST=http://localhost:11434   (local dev — free, no limits)
 *   GROQ_API_KEY, GROQ_API_KEY_1, ...   (free at console.groq.com)
 *   GEMINI_API_KEY, GEMINI_API_KEY_1    (free at aistudio.google.com)
 *   CEREBRAS_API_KEY                    (free at cloud.cerebras.ai)
 *   NVIDIA_API_KEY, NVIDIA_API_KEY_1, ...    (free at build.nvidia.com)
 *   KIMI_API_KEY, KIMI_API_KEY_1, ...        (free at platform.moonshot.cn)
 */
import config from '@/vertical.config'

const _aiSystemPrompt = 'You are a helpful AI assistant.'

// ── Types ─────────────────────────────────────────────────────────────────────
export type Quality = 'fast' | 'balanced' | 'best'
type Msg = { role: 'user' | 'assistant'; content: string }
export interface AIResponse { text: string; provider: string; model: string }

// ── Ollama local model tiers ──────────────────────────────────────────────────
// Order matters: best local model first, fallback to smaller ones
const OLLAMA_TIERS: Record<Quality, string[]> = {
  fast:     ['gemma4:latest', 'llama3.2:latest'],
  balanced: ['qwen3.6:latest', 'gemma4:latest', 'llama3.2:latest'],
  best:     ['qwen3.6:latest', 'gemma4:latest', 'llama3.2:latest'],
}

// ── Cloud provider defaults ───────────────────────────────────────────────────
const DEFAULT_GROQ_TIERS: Record<Quality, string[]> = {
  fast:     ['llama-3.1-8b-instant'],
  balanced: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  best:     ['meta-llama/llama-4-scout-17b-16e-instruct', 'qwen/qwen3-32b', 'llama-3.3-70b-versatile'],
}

const DEFAULT_GEMINI_TIERS: Record<Quality, string[]> = {
  fast:     ['gemini-2.0-flash-lite'],
  balanced: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  best:     ['gemini-2.5-flash', 'gemini-2.0-flash'],
}

const DEFAULT_CEREBRAS_TIERS: Record<Quality, string[]> = {
  fast:     ['llama3.1-8b'],
  balanced: ['gpt-oss-120b', 'llama3.1-8b'],
  best:     ['qwen-3-235b-a22b-instruct-2507', 'gpt-oss-120b'],
}

const DEFAULT_NVIDIA_TIERS: Record<Quality, string[]> = {
  fast:     ['microsoft/phi-4-mini-instruct'],
  balanced: ['qwen/qwen2.5-72b-instruct'],
  best:     ['meta/llama-3.1-405b-instruct', 'mistralai/mistral-large-2-instruct'],
}

const DEFAULT_KIMI_TIERS: Record<Quality, string[]> = {
  fast:     ['moonshot-v1-8k'],
  balanced: ['moonshot-v1-32k'],
  best:     ['moonshot-v1-128k'],
}

const DEFAULT_OPENAI_TIERS: Record<Quality, string[]> = {
  fast:     ['gpt-4o-mini'],
  balanced: ['gpt-4o-mini', 'gpt-4o'],
  best:     ['gpt-4o', 'gpt-4o-mini'],
}

const DEFAULT_CLAUDE_TIERS: Record<Quality, string> = {
  fast:     'claude-haiku-4-5-20251001',
  balanced: 'claude-haiku-4-5-20251001',
  best:     'claude-sonnet-4-6',
}

// ── Edge Config model router ──────────────────────────────────────────────────
let _edgeConfig: {
  groq_tiers?: Record<Quality, string[]>
  gemini_tiers?: Record<Quality, string[]>
  cerebras_tiers?: Record<Quality, string[]>
  nvidia_tiers?: Record<Quality, string[]>
  kimi_tiers?: Record<Quality, string[]>
  claude_tiers?: Record<Quality, string>
} | null = null

async function getEdgeConfig() {
  if (_edgeConfig !== null) return _edgeConfig
  const connStr = process.env.EDGE_CONFIG
  if (!connStr) { _edgeConfig = {}; return _edgeConfig }
  try {
    const url   = new URL(connStr)
    const ecId  = url.pathname.replace('/', '')
    const token = url.searchParams.get('token')
    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${ecId}/items`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } } as RequestInit,
    )
    if (!res.ok) { _edgeConfig = {}; return _edgeConfig }
    const items: Array<{ key: string; value: unknown }> = await res.json()
    const cfg: Record<string, unknown> = {}
    for (const { key, value } of items) cfg[key] = value
    _edgeConfig = cfg as unknown as typeof _edgeConfig
    console.log('[AI] Loaded model tiers from Edge Config')
  } catch {
    _edgeConfig = {}
  }
  return _edgeConfig
}

async function getTiers() {
  const ec = await getEdgeConfig()
  return {
    groq:     (ec?.groq_tiers     ?? DEFAULT_GROQ_TIERS)     as Record<Quality, string[]>,
    gemini:   (ec?.gemini_tiers   ?? DEFAULT_GEMINI_TIERS)   as Record<Quality, string[]>,
    cerebras: (ec?.cerebras_tiers ?? DEFAULT_CEREBRAS_TIERS) as Record<Quality, string[]>,
    nvidia:   (ec?.nvidia_tiers   ?? DEFAULT_NVIDIA_TIERS)   as Record<Quality, string[]>,
    kimi:     (ec?.kimi_tiers     ?? DEFAULT_KIMI_TIERS)     as Record<Quality, string[]>,
    openai:   DEFAULT_OPENAI_TIERS,
    claude:   (ec?.claude_tiers   ?? DEFAULT_CLAUDE_TIERS)   as Record<Quality, string>,
  }
}

// ── Key rotation helper ───────────────────────────────────────────────────────
function getKeys(service: string): string[] {
  const keys: string[] = []
  const plain = process.env[`${service}_API_KEY`] || process.env[`${service}_TOKEN`]
  if (plain) keys.push(plain)
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`${service}_API_KEY_${i}`] || process.env[`${service}_TOKEN_${i}`]
    if (k) keys.push(k)
    else break
  }
  return [...new Set(keys)]
}

// ── Error classification ──────────────────────────────────────────────────────
function isQuotaError(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes('exhausted') || m.includes('rate_limit') || m.includes('rate limit') ||
    m.includes('quota') || m.includes('exceeded') || m.includes('billing') ||
    m.includes('credit') || m.includes('limit reached') || m.includes('timed out') ||
    m.includes('401') || m.includes('403') || m.includes('invalid_api_key') ||
    m.includes('unauthorized') || m.includes('not configured') || m.includes('no keys') ||
    m.includes('model_not_active') || m.includes('model not found') ||
    m.includes('not supported') || m.includes('overloaded') ||
    m.includes('service unavailable') || m.includes('529')
  )
}

const TIMEOUT_MS = 30_000

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${TIMEOUT_MS / 1000}s`)),
      TIMEOUT_MS,
    )
    promise.then(v => { clearTimeout(t); resolve(v) }, e => { clearTimeout(t); reject(e) })
  })
}

// ── OpenAI-compatible fetch (works for Ollama, Groq, Gemini, Cerebras) ────────
async function callOpenAICompat(
  baseUrl: string, providerName: string, key: string, model: string,
  system: string, messages: Msg[], maxTokens: number,
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  })
  if (!res.ok) {
    const e = await res.text()
    throw new Error(`${providerName}/${model} ${res.status}: ${e.slice(0, 200)}`)
  }
  const data = await res.json() as any
  return data.choices?.[0]?.message?.content || ''
}

// ── Ollama caller — local only, skipped if OLLAMA_HOST not set ────────────────
async function callOllama(
  quality: Quality, system: string, messages: Msg[], maxTokens: number,
): Promise<{ text: string; model: string }> {
  const host = process.env.OLLAMA_HOST
  if (!host) throw new Error('OLLAMA_HOST not configured')

  const models = OLLAMA_TIERS[quality]
  for (const model of models) {
    try {
      // Check model is actually available before trying
      const text = await withTimeout(
        callOpenAICompat(`${host}/v1`, 'Ollama', '', model, system, messages, maxTokens),
        `Ollama/${model}`,
      )
      if (text) {
        console.log(`[AI] Ollama/${model} responded`)
        return { text, model }
      }
    } catch (e: any) {
      const msg = (e.message || '').slice(0, 100)
      console.warn(`[AI] Ollama/${model} skip: ${msg}`)
      continue
    }
  }
  throw new Error('All Ollama models failed or unavailable')
}

// ── Cloud provider caller (with key rotation) ─────────────────────────────────
async function callProvider(
  baseUrl: string, providerName: string, service: string,
  models: string[], system: string, messages: Msg[], maxTokens: number,
): Promise<{ text: string; model: string }> {
  const keys = getKeys(service)
  if (keys.length === 0) throw new Error(`${service} not configured`)

  for (const model of models) {
    for (const key of keys) {
      try {
        const text = await withTimeout(
          callOpenAICompat(baseUrl, providerName, key, model, system, messages, maxTokens),
          `${providerName}/${model}`,
        )
        if (text) return { text, model }
      } catch (e: any) {
        const msg = (e.message || '').slice(0, 150)
        if (isQuotaError(msg)) {
          console.warn(`[AI] ${providerName}/${model} quota/skip: ${msg.slice(0, 80)}`)
          continue
        }
        throw e
      }
    }
  }
  throw new Error(`All ${providerName} models/keys exhausted`)
}

// ── Anthropic caller ──────────────────────────────────────────────────────────
async function callAnthropic(
  quality: Quality, system: string, messages: Msg[], maxTokens: number,
): Promise<{ text: string; model: string }> {
  const key = getKeys('ANTHROPIC')[0]
  if (!key) throw new Error('ANTHROPIC not configured')
  const tiers = await getTiers()
  const model = tiers.claude[quality]
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: key })

  const params: Parameters<typeof client.messages.create>[0] = {
    model, max_tokens: maxTokens, system, messages,
  }
  if (quality === 'best') {
    const budget = Math.min(10_000, Math.floor(maxTokens / 2))
    ;(params as any).thinking = { type: 'enabled', budget_tokens: budget }
  }

  const res = await withTimeout(client.messages.create(params), 'Anthropic') as any
  const textBlock = res.content.find((b: any) => b.type === 'text') as { text: string } | undefined
  return { text: textBlock?.text ?? (res.content[0] as { text: string }).text, model }
}

// ── Core callAI ───────────────────────────────────────────────────────────────
// Order: Ollama (local/free) → Groq (free) → Gemini (free) → Cerebras (free) → Anthropic (paid)
export async function callAI(
  system: string,
  messages: Msg[],
  maxTokens = 1024,
  quality: Quality = 'balanced',
): Promise<AIResponse> {
  const tiers = await getTiers()

  const providers = [
    // ── Free tier (always try these first) ───────────────────────────────────
    { name: 'ollama',    fn: () => callOllama(quality, system, messages, maxTokens) },
    { name: 'groq',      fn: () => callProvider('https://api.groq.com/openai/v1',                          'Groq',     'GROQ',     tiers.groq[quality],     system, messages, maxTokens) },
    { name: 'gemini',    fn: () => callProvider('https://generativelanguage.googleapis.com/v1beta/openai', 'Gemini',   'GEMINI',   tiers.gemini[quality],   system, messages, maxTokens) },
    { name: 'cerebras',  fn: () => callProvider('https://api.cerebras.ai/v1',                              'Cerebras', 'CEREBRAS', tiers.cerebras[quality], system, messages, maxTokens) },
    { name: 'nvidia',    fn: () => callProvider('https://integrate.api.nvidia.com/v1',                     'NVidia',   'NVIDIA',   tiers.nvidia[quality],   system, messages, maxTokens) },
    { name: 'kimi',      fn: () => callProvider('https://api.moonshot.cn/v1',                              'Kimi',     'KIMI',     tiers.kimi[quality],     system, messages, maxTokens) },
    // ── Paid fallback (only hit if all free tiers are exhausted) ─────────────
    { name: 'openai',    fn: () => callProvider('https://api.openai.com/v1',                               'OpenAI',   'OPENAI',   tiers.openai[quality],   system, messages, maxTokens) },
    { name: 'anthropic', fn: () => callAnthropic(quality, system, messages, maxTokens) },
  ]

  const tried: string[] = []
  for (const { name, fn } of providers) {
    try {
      const { text, model } = await fn()
      if (text) {
        if (tried.length) console.warn(`[AI] fell back to ${name}/${model} after: ${tried.join(' → ')}`)
        return { text, provider: name, model }
      }
    } catch (e: any) {
      const msg = (e.message || '').slice(0, 120)
      tried.push(`${name}(${msg})`)
      console.warn(`[AI] ${name} failed — trying next. Reason: ${msg}`)
    }
  }
  throw new Error(`All AI providers exhausted. Tried: ${tried.join(' | ')}`)
}

// ── Convenience wrapper ───────────────────────────────────────────────────────
export async function aiChat(
  messages: Msg[],
  systemPrompt?: string,
  maxTokens = 700,
  quality: Quality = 'balanced',
): Promise<string> {
  const system = systemPrompt ?? (config as any).aiSystemPrompt ?? _aiSystemPrompt
  const { text } = await callAI(system, messages, maxTokens, quality)
  return text
}

// ── In-memory response cache (1h TTL) ────────────────────────────────────────
const _cache = new Map<string, { text: string; ts: number }>()
const TTL    = 60 * 60 * 1000

export async function aiCached(key: string, fn: () => Promise<string>): Promise<string> {
  const hit = _cache.get(key)
  if (hit && Date.now() - hit.ts < TTL) return hit.text
  const text = await fn()
  _cache.set(key, { text, ts: Date.now() })
  return text
}
