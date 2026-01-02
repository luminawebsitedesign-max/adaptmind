import { useAuth } from '@/contexts/AuthContext';
import { WelcomeScreen } from './WelcomeScreen';

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const { completeOnboarding } = useAuth();

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  return <WelcomeScreen onContinue={handleComplete} onSkip={handleComplete} />;
}
