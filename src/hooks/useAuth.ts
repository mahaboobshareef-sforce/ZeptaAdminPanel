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
        console.warn('⏰ Auth loading timeout - forcing completion');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Get initial session
    const initAuth = async () => {
      try {
        console.log('🔐 [Bolt Dashboard] Initializing auth...');

        // Use getUser() instead of getSession() for fresh auth state
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error('❌ Auth user error:', userError);
          if (isMounted) setLoading(false);
          return;
        }

        // Also get session for token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
        }

        if (!isMounted) return;

        console.log('👤 Bolt user id:', authUser?.id);
        console.log('📧 Bolt user email:', authUser?.email);
        console.log('🎟️  Session exists:', !!session);

        setSession(session);
        setUser(authUser ?? null);

        if (authUser) {
          try {
            console.log('📊 Fetching user profile from public.users...');
            console.log('🔍 Query: SELECT * FROM users WHERE id =', authUser.id);

            // Fetch actual user profile from database
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .maybeSingle();

            console.log('📊 Profile query result:', {
              found: !!userProfile,
              role: userProfile?.role,
              error: error?.message
            });

            if (!isMounted) return;

            if (userProfile && !error) {
              console.log('✅ Profile loaded successfully!');
              console.log('   - Email:', userProfile.email);
              console.log('   - Role:', userProfile.role);
              console.log('   - Active:', userProfile.is_active);
              setProfile(userProfile);
            } else {
              console.error('❌ Profile not found or RLS blocked access');
              console.error('   - User ID:', authUser.id);
              console.error('   - Error:', error);
              console.error('   - This means is_staff() or RLS policy is blocking SELECT');
              setProfile(null);
            }
          } catch (err) {
            console.error('❌ Error fetching profile:', err);
            setProfile(null);
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      console.log('🔄 Auth state changed:', event);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        (async () => {
          console.log('📊 Fetching profile on auth change for:', session.user.id, session.user.email);
          try {
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            console.log('📊 Profile query result (auth change):', { userProfile, error });

            if (!isMounted) return;

            if (userProfile && !error) {
              console.log('✅ Profile updated:', userProfile.email, userProfile.role);
              setProfile(userProfile);
            } else {
              console.error('❌ Profile not found on auth change:', session.user.id, session.user.email, error);
              setProfile(null);
            }
          } catch (err) {
            console.error('❌ Profile fetch error:', err);
            setProfile(null);
          }
        })();
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
    console.log('🔐 [Bolt] Attempting sign in...');
    console.log('📧 Email:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in failed:', error.message);
      return { data, error };
    }

    console.log('✅ Sign in successful!');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 User email:', data.user?.email);

    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    return { error };
  };

  const isStaff = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut,
    isAdmin: isStaff, // For backward compatibility
    isStaff,
    isSuperAdmin,
  };
}