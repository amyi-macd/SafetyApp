import { supabase } from './supabase';

export type AgentProfile = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

export async function getProfile(email: string) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.log('No profile found:', error.message);
    return null;
  }

  return data;
}

export async function saveProfile(profile: AgentProfile) {
  const { data, error } = await supabase
    .from('agents')
    .upsert(profile, { onConflict: 'email' })
    .select()
    .single();

  if (error) {
    console.error('Error saving profile:', JSON.stringify(error));
    return null;
  }

  return data;
}