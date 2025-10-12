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

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          // Fetch actual user profile from database
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!isMounted) return;

          if (userProfile && !error) {
            setProfile(userProfile);
          } else {
            // Fallback to admin role if profile not found
            setProfile({
              id: session.user.id,
              full_name: 'Admin User',
              email: session.user.email || 'admin@zepta.com',
              mobile_number: null,
              role: 'admin',
              store_id: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      }

      setLoading(false);
    }).catch((err) => {
      console.error('Error getting session:', err);
      if (isMounted) setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

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
          setProfile(userProfile);
        } else {
          // Fallback to admin role if profile not found
          setProfile({
            id: session.user.id,
            full_name: 'Admin User',
            email: session.user.email || 'admin@zepta.com',
            mobile_number: null,
            role: 'admin',
            store_id: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      isMounted = false;
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