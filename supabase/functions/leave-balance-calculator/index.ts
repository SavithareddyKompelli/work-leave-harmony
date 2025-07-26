import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, year } = await req.json()

    // Get user employment details
    const { data: user } = await supabase
      .from('users')
      .select('employment_type, join_date')
      .eq('id', userId)
      .single()

    if (!user) {
      throw new Error('User not found')
    }

    // Get leave type configurations
    const { data: leaveConfigs } = await supabase
      .from('leave_types_config')
      .select('*')
      .eq('employment_type', user.employment_type)

    // Calculate months worked in the year
    const joinDate = new Date(user.join_date)
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31)
    
    const startDate = joinDate > startOfYear ? joinDate : startOfYear
    const endDate = new Date() < endOfYear ? new Date() : endOfYear
    
    const monthsWorked = Math.max(0, 
      (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
      (endDate.getMonth() - startDate.getMonth()) + 
      (endDate.getDate() >= startDate.getDate() ? 1 : 0)
    )

    // Update leave balances
    for (const config of leaveConfigs || []) {
      const accruedLeaves = (config.monthly_accrual * monthsWorked).toFixed(1)
      
      await supabase
        .from('leave_balances')
        .upsert({
          user_id: userId,
          leave_type: config.leave_type,
          year: year,
          accrued: parseFloat(accruedLeaves)
        })
    }

    return new Response(
      JSON.stringify({ success: true, monthsWorked, updatedBalances: leaveConfigs?.length }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})