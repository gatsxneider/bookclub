import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gvbxukwrqvwiaptcncns.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Ynh1a3dycXZ3aWFwdGNuY25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3OTE1MTUsImV4cCI6MjEwNTM2NzUxNX0.d6CUkJL6hNivk-0I-6xubA2winMIUverGQ1M6kZ8TDI';

export const createServerSupabaseClient = (authHeader?: string | null) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
};
