import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { switchStorageToUser } from '@/stores/appStore';
import { DEMO_MODE, demoUser, demoProfile, seedDemoData } from '@/lib/demo';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  welcome_form_completed: boolean;
  welcome_tutorial_completed: boolean;
  preferred_language: string | null;
  primary_use: string | null;
  user_notes: string | null;
  disable_auto_tutorial: boolean;
  created_at: string;
  updated_at: string;
}

interface WelcomeFormData {
  language: string;
  primaryUse: string;
  userNotes: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  completeWelcomeForm: (data: WelcomeFormData) => Promise<void>;
  dismissTutorial: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_MODE ? demoUser : null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(DEMO_MODE ? (demoProfile as Profile) : null);
  const [loading, setLoading] = useState(!DEMO_MODE);
  
  const hasHandledInitialSession = useRef(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Demo mode: no Supabase auth, no listeners, no network. Local data only.
    if (DEMO_MODE) {
      seedDemoData();
      return;
    }

    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Switch localStorage to this user's namespace
          switchStorageToUser(session.user.id);

          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id).then(fetchedProfile => {
                if (mounted && fetchedProfile) {
                  setProfile(fetchedProfile);
                  hasHandledInitialSession.current = true;
                }
              });
            }
          }, 0);
        } else {
          // Sign-out: clear user-scoped store
          switchStorageToUser(null);
          setProfile(null);
          hasHandledInitialSession.current = false;
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        switchStorageToUser(session.user.id);

        fetchProfile(session.user.id).then(fetchedProfile => {
          if (mounted && fetchedProfile) {
            setProfile(fetchedProfile);
            hasHandledInitialSession.current = true;
          }
        });
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (DEMO_MODE) return { error: null };
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        }
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    if (DEMO_MODE) return { error: null };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (DEMO_MODE) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    // Storage is cleared via onAuthStateChange handler (switchStorageToUser(null))
  };

  const completeOnboarding = async () => {
    if (DEMO_MODE) {
      setProfile((p) => (p ? { ...p, onboarding_completed: true } : p));
      return;
    }
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id);
    
    if (!error && profile) {
      setProfile({ ...profile, onboarding_completed: true });
    }
  };

  const completeWelcomeForm = async (data: WelcomeFormData) => {
    if (DEMO_MODE) {
      setProfile((p) => (p ? {
        ...p,
        welcome_form_completed: true,
        preferred_language: data.language || 'en',
        primary_use: data.primaryUse || null,
        user_notes: data.userNotes || null,
      } : p));
      return;
    }
    if (!user) {
      console.error('Cannot complete welcome form: No user logged in');
      return;
    }
    
    const updateData = { 
      welcome_form_completed: true,
      preferred_language: data.language?.slice(0, 10) || 'en',
      primary_use: data.primaryUse?.slice(0, 50) || null,
      user_notes: data.userNotes?.slice(0, 1000) || null,
    };
    
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error completing welcome form:', error);
      if (profile) {
        setProfile({ ...profile, ...updateData });
      }
      return;
    }
    
    setProfile(updatedProfile as Profile);
  };

  const dismissTutorial = async () => {
    if (DEMO_MODE) {
      setProfile((p) => (p ? { ...p, onboarding_completed: true } : p));
      return;
    }
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id);
    
    if (profile) {
      setProfile({ ...profile, onboarding_completed: true });
    }
    
    if (error) {
      console.error('Error dismissing tutorial:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      completeOnboarding,
      completeWelcomeForm,
      dismissTutorial,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
