// POST /api/ai
// Body: { messages: [{ role, content }], temperature }
// Returns: { content }
// Only signed-in users can call it, so strangers can't use your Groq key.

import { getUser, send, readBody, callGroq } from './_lib/server.js'

export const config = { maxDuration: 60 }

const MAX_MESSAGES = 4
const MAX_TOTAL_CHARS = 60000 // roughly a long resume + JD + instructions, with headroom

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

  const user = await getUser(req)
  if (!user) return send(res, 401, { error: 'Please sign in again.' })

  const { messages, temperature } = readBody(req)

  const valid = Array.isArray(messages) && messages.length > 0 && messages.length <= MAX_MESSAGES &&
    messages.every(m => ['system', 'user'].includes(m?.role) && typeof m?.content === 'string')
  if (!valid) return send(res, 400, { error: 'Invalid request.' })

  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0)
  if (totalChars > MAX_TOTAL_CHARS) return send(res, 413, { error: 'Your resume or job description is too long. Please shorten it and try again.' })

  try {
    const content = await callGroq(messages, temperature)
    return send(res, 200, { content })
  } catch (err) {
    console.error('AI call failed:', err.message)
    if (err.status === 429) return send(res, 429, { error: 'Our AI is busy right now. Please try again in a minute.' })
    return send(res, 502, { error: 'AI request failed. Please try again.' })
  }
}
