import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WelcomeScreen } from './WelcomeScreen';
import { FirstActionGuide } from './FirstActionGuide';

type OnboardingStep = 'welcome' | 'first-action';

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const { completeOnboarding } = useAuth();

  const handleWelcomeContinue = () => {
    setStep('first-action');
  };

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  const handleSkip = () => {
    completeOnboarding();
    onComplete();
  };

  if (step === 'welcome') {
    return <WelcomeScreen onContinue={handleWelcomeContinue} onSkip={handleSkip} />;
  }

  return <FirstActionGuide onComplete={handleComplete} onSkip={handleSkip} />;
}
