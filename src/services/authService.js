import { supabase } from '../config/supabase';

/**
 * Authentication Service Module
 * Handles user sign-up, sign-in, session management, and auth state changes
 * using Supabase Auth.
 */

/**
 * Register a new user account with email, password, and full name.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @param {string} params.fullName
 * @returns {Promise<{ user: object, session: object, error: object }>}
 */
export const registerUser = async ({ email, password, fullName }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    console.error('[authService.registerUser] Error:', error.message);
    return { user: null, session: null, error };
  }

  return { user: data.user, session: data.session, error: null };
};

/**
 * Authenticate existing user with email and password.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ user: object, session: object, error: object }>}
 */
export const loginUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[authService.loginUser] Error:', error.message);
    return { user: null, session: null, error };
  }

  return { user: data.user, session: data.session, error: null };
};

/**
 * Sign out current authenticated user session.
 * @returns {Promise<{ error: object }>}
 */
export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[authService.logoutUser] Error:', error.message);
  }
  return { error };
};

/**
 * Get current active session.
 * @returns {Promise<object|null>}
 */
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('[authService.getCurrentSession] Error:', error.message);
    return null;
  }
  return data.session;
};

/**
 * Get current authenticated user details.
 * @returns {Promise<object|null>}
 */
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return null;
  }
  return data.user;
};

/**
 * Subscribe to authentication state changes.
 * @param {function} callback
 * @returns {{ unsubscribe: function }}
 */
export const onAuthStateChange = (callback) => {
  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return authListener.subscription;
};
