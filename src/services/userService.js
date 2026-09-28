import { supabase } from '../config/supabase';

/**
 * User Profile Service Module
 * Handles interactions with the public.users database table.
 */

/**
 * Fetch public profile details for a specific user.
 * @param {string} userId - UUID of the user
 * @returns {Promise<{ profile: object, error: object }>}
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, full_name, email, date_registered')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('[userService.getUserProfile] Error:', error.message);
    return { profile: null, error };
  }

  return { profile: data, error: null };
};

/**
 * Update full name or profile fields for a user.
 * @param {string} userId
 * @param {object} updates
 * @returns {Promise<{ updated: object, error: object }>}
 */
export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[userService.updateUserProfile] Error:', error.message);
    return { updated: null, error };
  }

  return { updated: data, error: null };
};
