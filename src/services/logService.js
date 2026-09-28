import { supabase } from '../config/supabase';

/**
 * Authentication Audit Logging Service Module
 * Handles recording and fetching authentication activity in the 'authentication_log' table.
 */

/**
 * Create a new authentication attempt log entry.
 * @param {object} params
 * @param {string} [params.userId=null] - User UUID (optional for unknown/failed attempts)
 * @param {string} params.status - Authentication status (e.g., 'SUCCESS', 'FAILED_VERIFICATION', 'INVALID_CREDENTIALS')
 * @returns {Promise<{ log: object, error: object }>}
 */
export const createAuthLog = async ({ userId = null, status }) => {
  const now = new Date();
  const loginDate = now.toISOString().split('T')[0];
  const loginTime = now.toTimeString().split(' ')[0];

  const { data, error } = await supabase
    .from('authentication_log')
    .insert([
      {
        user_id: userId,
        login_date: loginDate,
        login_time: loginTime,
        status: status,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('[logService.createAuthLog] Error:', error.message);
    return { log: null, error };
  }

  return { log: data, error: null };
};

/**
 * Retrieve recent authentication logs for a specific user.
 * @param {string} userId - User UUID
 * @param {number} [limit=20] - Maximum records to fetch
 * @returns {Promise<{ logs: Array, error: object }>}
 */
export const getUserAuthLogs = async (userId, limit = 20) => {
  const { data, error } = await supabase
    .from('authentication_log')
    .select('log_id, user_id, login_date, login_time, status')
    .eq('user_id', userId)
    .order('login_date', { ascending: false })
    .order('login_time', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[logService.getUserAuthLogs] Error:', error.message);
    return { logs: [], error };
  }

  return { logs: data || [], error: null };
};
