import { supabase } from './supabase';

export async function getAgentId(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('id')
    .eq('email', email)
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function createSession(
  address: string,
  agentEmail: string,
  timerMinutes: number = 30
) {
  console.log('Creating session for:', address);

  // Get agent ID from email
  const agentId = await getAgentId(agentEmail);

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      address,
      agent_id: agentId,
      timer_minutes: timerMinutes,
      status: 'active',
      check_in_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', JSON.stringify(error));
    return null;
  }

  console.log('Session created:', data);
  return data;
}

export async function updateSession(
  sessionId: string,
  updates: { status?: string; check_out_time?: string }
) {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating session:', JSON.stringify(error));
    return null;
  }

  return data;
}

export async function createAlert(
  sessionId: string,
  alertType: string
) {
  const { error } = await supabase
    .from('alerts')
    .insert({
      session_id: sessionId,
      alert_type: alertType,
      sent_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error creating alert:', JSON.stringify(error));
  }
}