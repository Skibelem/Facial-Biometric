import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentSession,
  onAuthStateChange,
} from '../services/authService';
import { getUserProfile } from '../services/userService';

const BIOMETRIC_SESSION_KEY = 'facial_biometric_session_v1';

const saveBiometricSessionLocally = (sessionData) => {
  try {
    localStorage.setItem(BIOMETRIC_SESSION_KEY, JSON.stringify(sessionData));
  } catch (err) {
    console.error('[AuthContext] Error saving biometric session locally:', err);
  }
};

const getBiometricSessionLocally = () => {
  try {
    const raw = localStorage.getItem(BIOMETRIC_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[AuthContext] Error reading biometric session locally:', err);
    return null;
  }
};

const clearBiometricSessionLocally = () => {
  try {
    localStorage.removeItem(BIOMETRIC_SESSION_KEY);
  } catch (err) {
    console.error('[AuthContext] Error clearing biometric session locally:', err);
  }
};

export const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
  authenticateBiometricUser: async () => {},
  refreshProfile: async () => {},
});

/**
 * AuthProvider Component
 * Manages global user authentication session, active user metadata, and profile state.
 * Supports persistent facial biometric sessions alongside Supabase Auth.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to fetch profile from public.users with retry logic for trigger execution
  const fetchProfile = async (userId, retries = 3) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    let attempt = 0;
    while (attempt < retries) {
      const { profile: userProfile } = await getUserProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
        return;
      }
      attempt += 1;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.warn(`[AuthContext] Profile fetch warning for user ${userId}`);
    setProfile(null);
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const initialSession = await getCurrentSession();

        if (initialSession?.user) {
          if (mounted) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchProfile(initialSession.user.id);
          }
        } else {
          // Check for persisted facial biometric session
          const localBio = getBiometricSessionLocally();
          if (localBio?.user && localBio?.session) {
            console.log('[AuthContext] Hydrating persistent facial biometric session for:', localBio.user.email);
            if (mounted) {
              setSession(localBio.session);
              setUser(localBio.user);
              if (localBio.profile) {
                setProfile(localBio.profile);
              } else {
                await fetchProfile(localBio.user.id);
              }
            }
          }
        }
      } catch (err) {
        console.error('[AuthContext] Initialization error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen to Supabase Auth state changes
    const authSubscription = onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (currentSession?.user) {
        clearBiometricSessionLocally();
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
      } else {
        // If Supabase Auth returns null, preserve active biometric session if present
        const localBio = getBiometricSessionLocally();
        if (localBio?.user && localBio?.session) {
          console.log('[AuthContext] Preserving active biometric session');
          setSession(localBio.session);
          setUser(localBio.user);
          if (localBio.profile) {
            setProfile(localBio.profile);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const register = async ({ email, password, fullName }) => {
    setError(null);
    setLoading(true);
    try {
      clearBiometricSessionLocally();
      const res = await registerUser({ email, password, fullName });
      if (res.error) {
        setError(res.error.message);
        return { success: false, session: null, error: res.error };
      }

      if (res.user) {
        setUser(res.user);
      }
      if (res.session) {
        setSession(res.session);
        await fetchProfile(res.user.id);
      }

      return { success: true, session: res.session, user: res.user, error: null };
    } catch (err) {
      const errObj = { message: err.message || 'Registration failed' };
      setError(errObj.message);
      return { success: false, session: null, error: errObj };
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setError(null);
    setLoading(true);
    try {
      clearBiometricSessionLocally();
      const res = await loginUser({ email, password });
      if (res.error) {
        setError(res.error.message);
        return { success: false, error: res.error };
      }

      setSession(res.session);
      setUser(res.user);
      if (res.user) {
        await fetchProfile(res.user.id);
      }

      return { success: true, error: null };
    } catch (err) {
      const errObj = { message: err.message || 'Login failed' };
      setError(errObj.message);
      return { success: false, error: errObj };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticate user session following successful server-side 1:N facial biometric identification.
   * Creates a persistent session and hydrates AuthContext.
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.email
   * @param {string} params.fullName
   */
  const authenticateBiometricUser = async ({ userId, email, fullName }) => {
    setError(null);
    setLoading(true);
    try {
      const bioUser = {
        id: userId,
        email: email,
        user_metadata: { full_name: fullName || 'Enrolled User' },
      };

      const bioSession = {
        access_token: `biometric-session-${userId}-${Date.now()}`,
        user: bioUser,
        is_biometric: true,
      };

      // Fetch user profile from database
      let bioProfile = null;
      const { profile: userProfile } = await getUserProfile(userId);
      if (userProfile) {
        bioProfile = userProfile;
      } else {
        bioProfile = {
          user_id: userId,
          email: email,
          full_name: fullName || 'Enrolled User',
        };
      }

      // Update React state synchronously
      setUser(bioUser);
      setSession(bioSession);
      setProfile(bioProfile);

      // Persist in localStorage for continuity across page refreshes and browser reopens
      saveBiometricSessionLocally({
        user: bioUser,
        session: bioSession,
        profile: bioProfile,
      });

      console.log('[AuthContext] Biometric session successfully created and persisted for:', email);
      return { success: true, error: null };
    } catch (err) {
      console.error('[AuthContext.authenticateBiometricUser] Error:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      clearBiometricSessionLocally();
      await logoutUser();
      setSession(null);
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    error,
    register,
    login,
    logout,
    authenticateBiometricUser,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
