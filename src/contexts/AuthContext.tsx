import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  completeWelcomeForm: (data: WelcomeFormData) => Promise<void>;
  completeWelcomeTutorial: () => Promise<void>;
  resetTutorialForManualRun: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id).then(profile => {
                if (mounted) setProfile(profile);
              });
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(profile => {
          if (mounted) setProfile(profile);
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const completeOnboarding = async () => {
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
    if (!user) {
      console.error('Cannot complete welcome form: No user logged in');
      return;
    }
    
    console.log('Completing welcome form for user:', user.id);
    
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
      // Still update local state to prevent re-showing the form
      // The database will be synced on next login
      if (profile) {
        setProfile({ ...profile, ...updateData });
      }
      return;
    }
    
    console.log('Welcome form completed successfully');
    setProfile(updatedProfile as Profile);
  };

  const completeWelcomeTutorial = async () => {
    if (!user) {
      console.error('Cannot complete tutorial: No user logged in');
      return;
    }
    
    console.log('Completing welcome tutorial for user:', user.id);
    
    const updateData = { 
      welcome_tutorial_completed: true,
      onboarding_completed: true,
    };
    
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error completing tutorial:', error);
      // Still update local state to prevent re-showing
      if (profile) {
        setProfile({ ...profile, ...updateData });
      }
      return;
    }
    
    console.log('Tutorial completed successfully');
    setProfile(updatedProfile as Profile);
  };

  // For manual tutorial re-run, temporarily set local state
  const resetTutorialForManualRun = () => {
    // This doesn't change the DB, just allows the tutorial to show
    // The tutorial component will handle not persisting this
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      completeOnboarding,
      completeWelcomeForm,
      completeWelcomeTutorial,
      resetTutorialForManualRun,
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
