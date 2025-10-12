import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { User as AppUser } from '../types/database';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Add timeout protection
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth loading timeout - forcing completion');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Get initial session
    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          if (isMounted) setLoading(false);
          return;
        }

        if (!isMounted) return;

        console.log('👤 Session:', session ? 'Found' : 'Not found');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            console.log('📊 Fetching user profile...');
            // Fetch actual user profile from database
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (!isMounted) return;

            if (userProfile && !error) {
              console.log('✅ Profile loaded:', userProfile.email, userProfile.role);
              setProfile(userProfile);
            } else {
              console.error('❌ Profile not found for user:', session.user.id, error);
              setProfile(null);
            }
          } catch (err) {
            console.error('❌ Error fetching profile:', err);
          }
        }

        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err);
        if (isMounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔄 Auth state changed:', event);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fetch actual user profile from database
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!isMounted) return;

        if (userProfile && !error) {
          console.log('✅ Profile updated:', userProfile.email);
          setProfile(userProfile);
        } else {
          console.error('❌ Profile not found on auth change:', session.user.id, error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    return { error };
  };

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: true,
  };
}