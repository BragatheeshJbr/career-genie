// Shared helpers for Career Genie serverless functions.
// Files in api/_lib are NOT exposed as endpoints (Vercel ignores folders starting with "_").
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Local development only: read keys from .env.local / .env.
// On the live site Vercel provides the keys itself, so this does nothing there.
if (process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_ENV !== 'preview') {
  for (const file of ['.env.local', '.env']) {
    try {
      const text = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (!match) continue
        const [, key, raw] = match
        const value = raw.replace(/^["']|["']$/g, '').trim()
        if (value && !process.env[key]) process.env[key] = value
      }
    } catch { /* file not found — skip */ }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Admin client — server only. Bypasses RLS, so never expose this key to the browser.
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })

// Returns the signed-in Supabase user from the "Authorization: Bearer <token>" header, or null.
export async function getUser(req) {
  const header = req.headers.authorization || req.headers.Authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  const { data, error } = await supabaseAnon.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

export function send(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

// Vercel usually parses JSON bodies already; this covers the cases where it doesn't.
export function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  try { return JSON.parse(req.body || '{}') } catch { return {} }
}

// One Groq call. Model is fixed on the server so the browser can't switch to something expensive.
// If Groq says "rate limit, try again in Xs", wait and retry (up to 2 times) instead of failing.
export async function callGroq(messages, temperature = 0.3) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages,
        temperature: Math.min(Math.max(Number(temperature) || 0.3, 0), 1)
      })
    })
    const data = await response.json()

    // Rate limited: wait the time Groq asks for (if 20s or less), then try again
    if (response.status === 429 && attempt < 2) {
      const msg = data?.error?.message || ''
      const secs = parseFloat((msg.match(/try again in ([\d.]+)s/) || [])[1]) || 5
      if (secs <= 20) {
        await new Promise(r => setTimeout(r, (secs + 0.5) * 1000))
        continue
      }
    }

    if (!response.ok) {
      const err = new Error(data?.error?.message || `Groq error ${response.status}`)
      err.status = response.status
      throw err
    }
    return data.choices?.[0]?.message?.content || ''
  }
}