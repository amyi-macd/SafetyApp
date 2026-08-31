
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')!;

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
  console.log('Twilio response:', JSON.stringify(data));

  if (!response.ok) {
    return { success: false, error: data };
  }

  return { success: true, sid: data.sid };
}

Deno.serve(async (req) => {
  const { agentPhone, emergencyPhone, agentName, address } = await req.json();

  console.log('Sending test alerts to:', agentPhone, emergencyPhone);

  const agentResult = await sendSMS(
    agentPhone,
    `⚠️ TWB Safety Test: This is a test alert from the TWB Safety App for inspection at ${address}. If this were real, you would need to respond.`
  );

  const emergencyResult = await sendSMS(
    emergencyPhone,
    `⚠️ TWB Safety Test: This is a test alert. ${agentName} is conducting an inspection at ${address}. In a real alert, you would need to contact them.`
  );

  return new Response(
    JSON.stringify({
      agentSMS: agentResult,
      emergencySMS: emergencyResult,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});