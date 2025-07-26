import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  try {
    const { leaveData, userEmail, userName, managerEmail } = await req.json()

    const emailBody = `
      <h2>Leave Application Notification</h2>
      <p><strong>Employee:</strong> ${userName} (${userEmail})</p>
      <p><strong>Leave Type:</strong> ${leaveData.leave_type}</p>
      <p><strong>Start Date:</strong> ${leaveData.start_date}</p>
      <p><strong>End Date:</strong> ${leaveData.end_date}</p>
      <p><strong>Total Days:</strong> ${leaveData.total_days}</p>
      <p><strong>Reason:</strong> ${leaveData.reason}</p>
      <p><strong>Applied At:</strong> ${new Date(leaveData.applied_at).toLocaleString()}</p>
    `

    // Send to HR
    const hrResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'HRMS <noreply@yourdomain.com>',
        to: ['Exleaves@domain.com'], // HR email
        subject: `Leave Application - ${userName} - ${leaveData.leave_type}`,
        html: emailBody,
      }),
    })

    // Send to Manager if available
    if (managerEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'HRMS <noreply@yourdomain.com>',
          to: [managerEmail],
          subject: `Team Leave Application - ${userName}`,
          html: emailBody + `<p><em>Please review and approve/reject this leave application.</em></p>`,
        }),
      })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }
})