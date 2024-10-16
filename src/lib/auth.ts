import { supabase } from '@/lib/supabase';

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error logging out:', error.message);
  }
  window.location.href = '/login';
}