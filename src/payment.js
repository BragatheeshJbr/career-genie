// Amounts here must match TIER_AMOUNT in api/jobs.js — the server rejects payments of the wrong amount.
export const PLANS = {
  FRESHER_SEARCH: {
    amount: 1900,
    currency: 'INR',
    name: 'Broad Search',
    description: 'Cast the widest net — search across thousands of job boards',
    price: '₹19'
  },
  INDIA_SEARCH: {
    amount: 2900,
    currency: 'INR',
    name: 'Smart Search',
    description: 'Google for Jobs powered — Naukri, LinkedIn, Indeed, Internshala in one search',
    price: '₹29'
  },
  MNC_SEARCH: {
    amount: 3900,
    currency: 'INR',
    name: 'Global Search',
    description: 'Jobs abroad and remote roles — most overseas jobs need a work visa',
    price: '₹39'
  }
}

// VITE_RAZORPAY_KEY_ID is the *public* key — it's meant to be in the browser.
// The secret key lives only on the server (RAZORPAY_KEY_SECRET).
export function openRazorpay({ plan, user, onSuccess, onFailure }) {
  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: plan.amount,
    currency: plan.currency,
    name: 'Career Genie',
    description: plan.description,
    handler: function (response) {
      // response.razorpay_payment_id is sent to /api/jobs, which verifies it with Razorpay
      onSuccess(response)
    },
    prefill: {
      email: user?.email || '',
      name: user?.user_metadata?.full_name || '',
      contact: ''
    },
    // user_id lets the server confirm the payment belongs to the signed-in user
    notes: { feature: plan.name, user_id: user?.id || '' },
    theme: { color: '#f5c518' },
    modal: {
      ondismiss: function () {
        if (onFailure) onFailure()
      }
    }
  }
  const rzp = new window.Razorpay(options)
  rzp.open()
}