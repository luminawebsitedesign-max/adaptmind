import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeFormModal, WelcomeFormData } from './WelcomeFormModal';
import { WelcomeTutorial } from './WelcomeTutorial';

type OnboardingStep = 'form' | 'tutorial' | 'complete';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { profile, completeWelcomeForm, completeWelcomeTutorial } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('complete');

  useEffect(() => {
    if (!profile) return;
    
    // Determine which step to show
    if (!profile.welcome_form_completed) {
      setCurrentStep('form');
    } else if (!profile.welcome_tutorial_completed) {
      setCurrentStep('tutorial');
    } else {
      setCurrentStep('complete');
      onComplete();
    }
  }, [profile, onComplete]);

  const handleFormComplete = async (data: WelcomeFormData) => {
    await completeWelcomeForm(data);
    setCurrentStep('tutorial');
  };

  const handleFormSkip = async () => {
    await completeWelcomeForm({ language: 'en', primaryUse: '', userNotes: '' });
    setCurrentStep('tutorial');
  };

  const handleTutorialComplete = async () => {
    await completeWelcomeTutorial();
    onComplete();
  };

  const handleTutorialSkip = async () => {
    await completeWelcomeTutorial();
    onComplete();
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