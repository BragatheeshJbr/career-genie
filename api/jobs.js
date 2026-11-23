// POST /api/jobs
// Body: { tier: 'broad' | 'smart' | 'direct', searchQuery, currentRole, location, paymentId }
// Returns: { jobs: [...] }
//
// Runs a job search ONLY after confirming with Razorpay's servers that:
//   1. the payment is real and captured,
//   2. it was for the right amount for this tier,
//   3. it belongs to this user, and
//   4. it hasn't already been used (one payment = one search, plus up to 2 free retries).

import { getUser, send, readBody, supabaseAdmin } from './_lib/server.js'

export const config = { maxDuration: 30 }

const TIER_AMOUNT = { broad: 1900, smart: 2900, direct: 3900 } // paise — must match PLANS in src/payment.js
const MAX_USES = 3            // first search + 2 free retries (e.g. "Retry — free" when nothing was found)
const RETRY_WINDOW_MS = 2 * 60 * 60 * 1000 // retries allowed for 2 hours after paying

const clean = (v, max = 100) => String(v || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, max)

// ---------- Razorpay verification ----------

function razorpayAuth() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID
  const secret = process.env.RAZORPAY_KEY_SECRET
  return 'Basic ' + Buffer.from(`${keyId}:${secret}`).toString('base64')
}

async function verifyPayment(paymentId, expectedAmount, userId) {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: razorpayAuth() }
  })
  if (!res.ok) return { ok: false, reason: 'Payment not found.' }
  let payment = await res.json()

  if (payment.amount !== expectedAmount || payment.currency !== 'INR') {
    return { ok: false, reason: 'Payment amount does not match this search.' }
  }
  if (payment.notes?.user_id && payment.notes.user_id !== userId) {
    return { ok: false, reason: 'This payment belongs to a different account.' }
  }

  // If the Razorpay account isn't set to auto-capture, capture it now.
  if (payment.status === 'authorized') {
    const cap = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
      method: 'POST',
      headers: { Authorization: razorpayAuth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: expectedAmount, currency: 'INR' })
    })
    if (cap.ok) payment = await cap.json()
  }

  if (payment.status !== 'captured') return { ok: false, reason: 'Payment is not complete.' }
  return { ok: true }
}

// Marks the payment as used. Allows the same user a couple of retries on the same tier.
async function claimPayment(paymentId, userId, tier, amount) {
  if (!supabaseAdmin) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')

  const { error } = await supabaseAdmin
    .from('used_payments')
    .insert({ payment_id: paymentId, user_id: userId, tier, amount, uses: 1 })

  if (!error) return { ok: true }
  if (error.code !== '23505') throw error // 23505 = already exists

  const { data: row } = await supabaseAdmin
    .from('used_payments')
    .select('user_id, tier, uses, created_at')
    .eq('payment_id', paymentId)
    .single()

  const withinWindow = row && Date.now() - new Date(row.created_at).getTime() < RETRY_WINDOW_MS
  if (row && row.user_id === userId && row.tier === tier && row.uses < MAX_USES && withinWindow) {
    await supabaseAdmin.from('used_payments').update({ uses: row.uses + 1 }).eq('payment_id', paymentId)
    return { ok: true }
  }
  return { ok: false, reason: 'This payment has already been used. Please start a new search.' }
}

// ---------- Job providers (moved from JobFinder.jsx) ----------

async function searchAdzuna(searchQuery, locationQuery) {
  const loc = locationQuery || 'india'
  const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_APP_KEY}&results_per_page=20&what=${encodeURIComponent(searchQuery)}&where=${encodeURIComponent(loc)}&content-type=application/json`
  const response = await fetch(url)
  const data = await response.json()
  return (data.results || []).map(job => ({
    job_title: job.title,
    employer_name: job.company?.display_name || 'Company',
    employer_logo: null,
    job_city: job.location?.display_name || loc,
    job_country: 'India',
    job_is_remote: job.title?.toLowerCase().includes('remote') || false,
    job_employment_type: job.contract_time || 'Full Time',
    job_description: job.description || '',
    job_apply_link: job.redirect_url,
    job_posted_at_timestamp: job.created ? new Date(job.created).getTime() / 1000 : null,
    job_min_salary: job.salary_min ? Math.round(job.salary_min) : null,
    job_max_salary: job.salary_max ? Math.round(job.salary_max) : null,
    job_salary_currency: '₹',
    source: 'Adzuna'
  }))
}

async function searchJSearch(searchQuery, locationQuery) {
  const q = `${searchQuery} jobs in ${locationQuery}`
  const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(q)}&page=1&num_pages=2&country=in`
  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': process.env.JSEARCH_API_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  })
  const data = await response.json()
  if (data.data && data.data.jobs && Array.isArray(data.data.jobs)) return data.data.jobs
  if (data.data && Array.isArray(data.data)) return data.data
  if (data.jobs && Array.isArray(data.jobs)) return data.jobs
  return []
}

async function searchJobsPipe(searchQuery) {
  const response = await fetch('https://api.jobspipe.dev/v1/jobs/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.JOBSPIPE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ job_title_or: [searchQuery], limit: 20 })
  })
  const data = await response.json()
  return (data.jobs || data.data || []).map(job => ({
    job_title: job.title || job.job_title,
    employer_name: job.company || job.employer_name,
    employer_logo: job.company_logo || job.employer_logo,
    job_city: job.location || job.job_city,
    job_country: job.country || job.job_country,
    job_is_remote: job.remote || job.job_is_remote,
    job_employment_type: job.employment_type || job.job_employment_type,
    job_description: job.description || job.job_description,
    job_apply_link: job.apply_url || job.job_apply_link || job.url,
    job_posted_at_timestamp: job.posted_at ? new Date(job.posted_at).getTime() / 1000 : null,
    job_min_salary: job.salary_min || job.min_salary,
    job_max_salary: job.salary_max || job.max_salary,
    source: 'JobsPipe'
  }))
}

// ---------- Handler ----------

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

  const user = await getUser(req)
  if (!user) return send(res, 401, { error: 'Please sign in again.' })

  const body = readBody(req)
  const tier = body.tier
  const paymentId = clean(body.paymentId, 40)
  const searchQuery = clean(body.searchQuery) || clean(body.currentRole)
  const currentRole = clean(body.currentRole)
  const location = clean(body.location, 60) || 'India'

  if (!TIER_AMOUNT[tier]) return send(res, 400, { error: 'Unknown search type.' })
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) return send(res, 402, { error: 'Payment required.' })
  if (!searchQuery) return send(res, 400, { error: 'Could not read a job title from your resume.' })

  try {
    const verified = await verifyPayment(paymentId, TIER_AMOUNT[tier], user.id)
    if (!verified.ok) return send(res, 402, { error: verified.reason })

    const claimed = await claimPayment(paymentId, user.id, tier, TIER_AMOUNT[tier])
    if (!claimed.ok) return send(res, 409, { error: claimed.reason })

    let jobs = []
    if (tier === 'broad') {
      jobs = await searchAdzuna(searchQuery, location)
      if (jobs.length === 0 && currentRole) jobs = await searchAdzuna(currentRole, location)
    } else if (tier === 'smart') {
      jobs = await searchJSearch(searchQuery, location)
      if (jobs.length === 0) jobs = await searchJSearch(searchQuery, 'India')
    } else {
      jobs = await searchJobsPipe(searchQuery) // Global: no location filter, on purpose
    }

    return send(res, 200, { jobs })
  } catch (err) {
    console.error('Job search failed:', err)
    return send(res, 502, { error: 'Job search failed. Your payment is safe — tap Retry to search again for free.' })
  }
}
