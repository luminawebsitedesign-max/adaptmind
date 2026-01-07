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
    
    // Welcome form: show only if never completed
    if (!profile.welcome_form_completed) {
      setCurrentStep('form');
      return;
    }
    
    // Tutorial: show on every sign-in UNLESS user disabled auto-tutorial
    // The tutorial is shown regardless of welcome_tutorial_completed
    // (welcome_tutorial_completed just tracks if they've seen it this session)
    if (!profile.disable_auto_tutorial && !profile.welcome_tutorial_completed) {
      setCurrentStep('tutorial');
      return;
    }
    
    // All done for this session
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
    return (
      <WelcomeTutorial
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    );
  }

  return null;
}

// Standalone tutorial component for manual re-run from settings
interface StandaloneTutorialProps {
  onComplete: () => void;
}

export function StandaloneTutorial({ onComplete }: StandaloneTutorialProps) {
  return (
    <WelcomeTutorial
      onComplete={onComplete}
      onSkip={onComplete}
    />
  );
}