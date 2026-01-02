import { useAuth } from '@/contexts/AuthContext';
import { OnboardingModal } from './OnboardingModal';

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const { completeOnboarding } = useAuth();

  const handleComplete = () => {
    completeOnboarding();
    onComplete();
  };

  return <OnboardingModal onComplete={handleComplete} />;
}
