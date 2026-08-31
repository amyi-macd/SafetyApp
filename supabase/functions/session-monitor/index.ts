import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Send SMS via Twilio
async function sendSMS(to: string, message: string) {
  const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: to,
        Body: message,
      }).toString(),
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    console.error('Twilio error:', JSON.stringify(data));
    return false;
  }
  
  console.log('SMS sent to:', to);
  return true;
}

// Get agent details for a session
async function getAgentForSession(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('agent_id, address, agents(name, phone, emergency_contact_name, emergency_contact_phone)')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching agent:', error);
    return null;
  }

  return data;
}

Deno.serve(async () => {
  console.log('Session monitor running...');

  // Find active sessions where timer has expired
  const { data: expiredSessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'active')
    .lt('check_in_time', new Date(
      Date.now() - 30 * 60 * 1000
    ).toISOString());

  if (error) {
    console.error('Error fetching sessions:', error);
    return new Response('Error', { status: 500 });
  }

  console.log(`Found ${expiredSessions?.length ?? 0} expired sessions`);

  for (const session of expiredSessions ?? []) {
    console.log('Processing session:', session.id);

    // Get agent details
    const agentData = await getAgentForSession(session.id);
    const agent = agentData?.agents as any;

    // Check if first warning already sent
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('session_id', session.id)
      .eq('alert_type', 'server_warning_1');

    const alreadySentFirstWarning = existingAlerts && existingAlerts.length > 0;

    if (!alreadySentFirstWarning) {
      // Send first warning
      console.log('Sending first warning for session:', session.id);

      // SMS to agent
      if (agent?.phone) {
        await sendSMS(
          agent.phone,
          `⚠️ TWB Safety Alert: Your inspection timer at ${session.address} has expired. Reply "SAFE" if you are okay, or call 000 if you need help.`
        );
      }

      // SMS to emergency contact
      if (agent?.emergency_contact_phone) {
        await sendSMS(
          agent.emergency_contact_phone,
          `⚠️ TWB Safety Alert: ${agent?.name || 'An agent'} has been at ${session.address} for over 30 minutes without checking out. Please try to contact them. If you cannot reach them, call 000.`
        );
      }

      // Log the alert
      await supabase.from('alerts').insert({
        session_id: session.id,
        alert_type: 'server_warning_1',
        sent_at: new Date().toISOString(),
      });

      // Update session status
      await supabase.from('sessions')
        .update({ status: 'warning_1' })
        .eq('id', session.id);

    } else {
      // Check if first warning was sent more than 5 minutes ago
      const firstWarning = existingAlerts[0];
      const warningAge = Date.now() - new Date(firstWarning.sent_at).getTime();
      const fiveMinutes = 5 * 60 * 1000;

      if (warningAge > fiveMinutes) {
        // Check if second warning already sent
        const { data: secondWarnings } = await supabase
          .from('alerts')
          .select('*')
          .eq('session_id', session.id)
          .eq('alert_type', 'server_warning_2');

        if (!secondWarnings || secondWarnings.length === 0) {
          console.log('Sending escalation for session:', session.id);

          // Escalation SMS to agent
          if (agent?.phone) {
            await sendSMS(
              agent.phone,
              `🚨 TWB URGENT: We have not heard from you at ${session.address}. Your emergency contact has been notified.`
            );
          }

          // Escalation SMS to emergency contact
          if (agent?.emergency_contact_phone) {
            await sendSMS(
              agent.emergency_contact_phone,
              `🚨 TWB URGENT: ${agent?.name || 'An agent'} at ${session.address} has not responded to our safety alert. Please call them immediately.`
            );
          }

          // Log escalation alert
          await supabase.from('alerts').insert({
            session_id: session.id,
            alert_type: 'server_warning_2',
            sent_at: new Date().toISOString(),
          });

          // Update session status
          await supabase.from('sessions')
            .update({ status: 'warning_2' })
            .eq('id', session.id);
        }
      }
    }
  }

  return new Response(
    JSON.stringify({
      processed: expiredSessions?.length ?? 0,
      timestamp: new Date().toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});