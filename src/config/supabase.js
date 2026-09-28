import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('placeholder-project');

if (!isConfigured) {
  console.warn(
    '[Supabase Config] Missing or placeholder VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY environment variables.'
  );
}

// Create and export Supabase client instance
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

/**
 * Check if the Supabase environment configuration is ready.
 * @returns {object} Status object indicating configuration readiness.
 */
export const checkSupabaseConnection = async () => {
  if (!isConfigured) {
    return {
      ready: false,
      configured: false,
      message: 'Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not configured with active credentials.',
    };
  }

  try {
    // Light test call to verify Supabase endpoint communication
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        ready: false,
        configured: true,
        message: `Supabase communication check returned error: ${error.message}`,
      };
    }
    return {
      ready: true,
      configured: true,
      message: 'Supabase client initialized and connected successfully.',
    };
  } catch (err) {
    return {
      ready: false,
      configured: true,
      message: `Failed to connect to Supabase: ${err.message}`,
    };
  }
};
