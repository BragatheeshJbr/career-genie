import { supabase } from './supabase'

export const trackEvent = async (userId, eventName, eventData = {}) => {
  try {
    await supabase.from('events').insert({
      user_id: userId,
      event_name: eventName,
      event_data: eventData
    })
  } catch (err) {
    console.error('Analytics error:', err)
  }
}

export const trackApiCall = async (apiName) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('api_usage')
      .select('*')
      .eq('api_name', apiName)
      .single()

    if (data) {
      const isNewDay = data.last_reset_date !== today
      await supabase
        .from('api_usage')
        .update({
          calls_today: isNewDay ? 1 : data.calls_today + 1,
          last_reset_date: today,
          total_calls: data.total_calls + 1,
          updated_at: new Date().toISOString()
        })
        .eq('api_name', apiName)
    }
  } catch (err) {
    console.error('API tracking error:', err)
  }
}