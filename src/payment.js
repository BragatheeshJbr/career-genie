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
    name: 'Direct Search',
    description: 'Straight from company career pages — freshest listings, no middleman',
    price: '₹39'
  }
}

export function openRazorpay({ plan, user, onSuccess, onFailure }) {
  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: plan.amount,
    currency: plan.currency,
    name: 'Career Genie',
    description: plan.description,
    handler: function (response) {
      onSuccess(response)
    },
    prefill: {
      email: user?.email || '',
      name: user?.user_metadata?.full_name || '',
      contact: ''
    },
    notes: { feature: plan.name },
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