// Browser-side helpers for calling our own serverless functions.
// No API keys live here — the server adds them.

import { supabase } from './supabase'

async function authHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw new Error('Please sign in again.')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

async function post(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body)
  })
  let data = {}
  try { data = await response.json() } catch { /* non-JSON error page */ }
  if (!response.ok) {
    const err = new Error(data.error || `Request failed (${response.status})`)
    err.status = response.status
    throw err
  }
  return data
}

// Same shape as before: send messages, get back the model's text.
export async function callAI(messages, temperature = 0.3) {
  const { content } = await post('/api/ai', { messages, temperature })
  return content
}

export async function searchJobs({ tier, searchQuery, currentRole, location, paymentId }) {
  const { jobs } = await post('/api/jobs', { tier, searchQuery, currentRole, location, paymentId })
  return jobs || []
}
