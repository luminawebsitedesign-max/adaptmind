import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/stores/appStore';
import { 
  CheckSquare, 
  Target, 
  Repeat, 
  Bot, 
  ArrowRight, 
  X,
  Sparkles 
} from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Welcome to Adaptmind',
    description: 'Your intelligent productivity companion. Let me show you around in 30 seconds.',
    icon: Sparkles,
    color: 'from-primary to-accent',
  },
  {
    id: 2,
    title: 'Manage Your Tasks',
    description: 'Create multiple to-do lists, set priorities and deadlines, and track your progress with beautiful visualizations.',
    icon: CheckSquare,
    color: 'from-primary to-primary',
    action: 'todos',
  },
  {
    id: 3,
    title: 'Track Your Goals',
    description: 'Set short-term and long-term goals with milestones. Watch your progress grow with each achievement.',
    icon: Target,
    color: 'from-secondary to-secondary',
    action: 'goals',
  },
  {
    id: 4,
    title: 'Build Better Habits',
    description: 'Create daily habits, maintain streaks, and see your consistency improve over time.',
    icon: Repeat,
    color: 'from-accent to-accent',
    action: 'habits',
  },
  {
    id: 5,
    title: 'AI-Powered Planning',
    description: 'Chat with your AI assistant to get personalized productivity advice and weekly plans based on your data.',
    icon: Bot,
    color: 'from-primary to-accent',
    action: 'assistant',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding } = useAuth();
  const { setCurrentView } = useAppStore();

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (step.action) {
      setCurrentView(step.action as any);
    }
    
    if (isLastStep) {
      completeOnboarding();
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg mx-4">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute -top-12 right-0 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          Skip tour <X className="w-4 h-4" />
        </button>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 relative overflow-hidden">
          {/* Background glow */}
          <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-5`} />
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-primary' 
                    : index < currentStep 
                    ? 'bg-primary/50' 
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center glow-cyan animate-pulse-slow`}>
              <StepIcon className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-display font-bold mb-3">{step.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            )}
            <Button
              className={`flex-1 glow-cyan ${currentStep === 0 ? 'w-full' : ''}`}
              onClick={handleNext}
            >
              {isLastStep ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>
      </div>
    </div>
  );
}
