import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { leaveId, action, approvedBy, rejectedReason } = await req.json() // action: 'approved' | 'rejected'

    // Get leave application details
    const { data: leave } = await supabase
      .from('leave_applications')
      .select(`
        *,
        user:users(full_name, email, employment_type),
        approver:users!approved_by(full_name, email)
      `)
      .eq('id', leaveId)
      .single()

    if (!leave) {
      throw new Error('Leave application not found')
    }

    // Update leave application status
    const updateData: any = {
      status: action,
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    }

    if (action === 'rejected' && rejectedReason) {
      updateData.rejected_reason = rejectedReason
    }

    await supabase
      .from('leave_applications')
      .update(updateData)
      .eq('id', leaveId)

    // If approved, update leave balance
    if (action === 'approved') {
      const year = new Date(leave.start_date).getFullYear()
      
      // Get current balance
      const { data: balance } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', leave.user_id)
        .eq('leave_type', leave.leave_type)
        .eq('year', year)
        .single()

      if (balance) {
        const newUsed = parseFloat(balance.used) + parseFloat(leave.total_days)
        let lopDays = 0

        // Calculate LOP if balance is insufficient
        if (newUsed > balance.current_balance) {
          lopDays = newUsed - balance.current_balance
        }

        await supabase
          .from('leave_balances')
          .update({
            used: newUsed,
            lop_days: parseFloat(balance.lop_days) + lopDays
          })
          .eq('id', balance.id)
      }
    }

    // Add to audit log
    await supabase
      .from('leave_audit_log')
      .insert({
        leave_application_id: leaveId,
        user_id: leave.user_id,
        action: action,
        performed_by: approvedBy,
        old_status: 'pending',
        new_status: action,
        comments: rejectedReason || `Leave ${action} by manager`
      })

    // Send notification email (you can integrate with your email service)
    const emailSubject = `Leave Application ${action.toUpperCase()}`
    const emailBody = `
      Your leave application from ${leave.start_date} to ${leave.end_date} has been ${action}.
      ${rejectedReason ? `Reason: ${rejectedReason}` : ''}
    `

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Leave ${action} successfully`,
        leaveDetails: leave
      }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})