import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const TUTORIAL_SESSION_KEY = 'adaptmind_tutorial_shown_this_session';

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
  toggleAutoTutorial: (disabled: boolean) => Promise<void>;
  resetTutorialForManualRun: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track if this is a genuine fresh sign-in (not a token refresh or tab refocus)
  const hasHandledInitialSession = useRef(false);
  const lastSignInTime = useRef<number>(0);

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
          // Determine if this is a genuine fresh sign-in
          // SIGNED_IN fires on: actual login, OAuth refresh, token refresh, page reload
          // We only want to show tutorial on ACTUAL fresh sign-ins
          const now = Date.now();
          const isGenuineFreshSignIn = event === 'SIGNED_IN' && 
            !hasHandledInitialSession.current && 
            (now - lastSignInTime.current > 5000); // Debounce 5 seconds
          
          if (event === 'SIGNED_IN') {
            lastSignInTime.current = now;
          }
          
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id).then(fetchedProfile => {
                if (mounted && fetchedProfile) {
                  // Only reset tutorial flag for genuine fresh sign-ins
                  // AND only if sessionStorage doesn't indicate tutorial was already shown
                  if (isGenuineFreshSignIn && !sessionStorage.getItem(TUTORIAL_SESSION_KEY)) {
                    setProfile({ ...fetchedProfile, welcome_tutorial_completed: false });
                  } else {
                    // For page reloads, token refreshes, etc. - check sessionStorage
                    const tutorialShownThisSession = sessionStorage.getItem(TUTORIAL_SESSION_KEY) === 'true';
                    setProfile({ 
                      ...fetchedProfile, 
                      welcome_tutorial_completed: tutorialShownThisSession || fetchedProfile.welcome_tutorial_completed 
                    });
                  }
                  hasHandledInitialSession.current = true;
                }
              });
            }
          }, 0);
        } else {
          setProfile(null);
          // Clear session flag on sign out so tutorial shows on next sign-in
          sessionStorage.removeItem(TUTORIAL_SESSION_KEY);
          hasHandledInitialSession.current = false;
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
        fetchProfile(session.user.id).then(fetchedProfile => {
          if (mounted && fetchedProfile) {
            // On initial page load (not a fresh sign-in), respect sessionStorage
            const tutorialShownThisSession = sessionStorage.getItem(TUTORIAL_SESSION_KEY) === 'true';
            setProfile({ 
              ...fetchedProfile, 
              welcome_tutorial_completed: tutorialShownThisSession || fetchedProfile.welcome_tutorial_completed 
            });
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

  // Dismiss tutorial for this session (doesn't disable auto-tutorial)
  const dismissTutorial = async () => {
    // Mark tutorial as shown for this session using sessionStorage
    // This prevents re-triggering on tab focus, token refresh, etc.
    sessionStorage.setItem(TUTORIAL_SESSION_KEY, 'true');
    
    // Update local state to hide tutorial for this session
    // Tutorial will show again on next fresh sign-in unless auto-tutorial is disabled
    if (profile) {
      setProfile({ ...profile, welcome_tutorial_completed: true, onboarding_completed: true });
    }
  };

  // Toggle auto-tutorial setting (persists to DB)
  const toggleAutoTutorial = async (disabled: boolean) => {
    if (!user) return;
    
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ disable_auto_tutorial: disabled })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error toggling auto-tutorial:', error);
      return;
    }
    
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
      signOut,
      completeOnboarding,
      completeWelcomeForm,
      dismissTutorial,
      toggleAutoTutorial,
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
