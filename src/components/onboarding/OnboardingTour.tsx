import { useAuth } from '@/contexts/AuthContext';
import { OnboardingFlow } from './OnboardingFlow';

interface OnboardingTourProps {
  onComplete: () => void;
}

// This component is kept for backwards compatibility
// It now delegates to the new OnboardingFlow
export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  return <OnboardingFlow onComplete={onComplete} />;
}