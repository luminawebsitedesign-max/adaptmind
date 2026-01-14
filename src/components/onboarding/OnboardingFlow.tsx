import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeFormModal, WelcomeFormData } from './WelcomeFormModal';
import { WelcomeTutorial } from './WelcomeTutorial';

type OnboardingStep = 'form' | 'tutorial' | 'complete';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { profile, completeWelcomeForm, dismissTutorial } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('complete');

  useEffect(() => {
    if (!profile) return;
    
    // Welcome form: show only if never completed (one-time only)
    if (!profile.welcome_form_completed) {
      setCurrentStep('form');
      return;
    }
    
    // Tutorial: show on EVERY sign-in UNLESS:
    // 1. User disabled auto-tutorial in settings, OR
    // 2. Tutorial was already shown this session (welcome_tutorial_completed is session-only state)
    if (!profile.disable_auto_tutorial && !profile.welcome_tutorial_completed) {
      setCurrentStep('tutorial');
      return;
    }
    
    // Tutorial disabled by user preference
    setCurrentStep('complete');
    onComplete();
  }, [profile, onComplete]);

  const handleFormComplete = async (data: WelcomeFormData) => {
    try {
      await completeWelcomeForm(data);
      // Only move to tutorial after form is saved
      setCurrentStep('tutorial');
    } catch (error) {
      console.error('Error completing welcome form:', error);
      // Still proceed to tutorial even if save fails
      setCurrentStep('tutorial');
    }
  };

  const handleFormSkip = async () => {
    try {
      await completeWelcomeForm({ language: 'en', primaryUse: '', userNotes: '' });
      setCurrentStep('tutorial');
    } catch (error) {
      console.error('Error skipping welcome form:', error);
      setCurrentStep('tutorial');
    }
  };

  const handleTutorialComplete = async () => {
    try {
      // Dismiss tutorial for this session (local state only)
      await dismissTutorial();
      onComplete();
    } catch (error) {
      console.error('Error completing tutorial:', error);
      onComplete();
    }
  };

  const handleTutorialSkip = async () => {
    try {
      await dismissTutorial();
      onComplete();
    } catch (error) {
      console.error('Error skipping tutorial:', error);
      onComplete();
    }
  };

  if (currentStep === 'complete') {
    return null;
  }

  if (currentStep === 'form') {
    return (
      <WelcomeFormModal
        onComplete={handleFormComplete}
        onSkip={handleFormSkip}
      />
    );
  }

  if (currentStep === 'tutorial') {
    const handleSavePreferences = async (language: string, usage: string) => {
      if (!completeWelcomeForm) return;
      try {
        // Save the preferences to profile - reuse completeWelcomeForm with updated data
        await completeWelcomeForm({
          language,
          primaryUse: usage,
          userNotes: '',
        });
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    };

    return (
      <WelcomeTutorial
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
        onSavePreferences={handleSavePreferences}
      />
    );
  }

  return null;
}

// Standalone tutorial component for manual re-run from settings
interface StandaloneTutorialProps {
  onComplete: () => void;
  onSavePreferences?: (language: string, usage: string) => void;
}

export function StandaloneTutorial({ onComplete, onSavePreferences }: StandaloneTutorialProps) {
  return (
    <WelcomeTutorial
      onComplete={onComplete}
      onSkip={onComplete}
      onSavePreferences={onSavePreferences}
    />
  );
}