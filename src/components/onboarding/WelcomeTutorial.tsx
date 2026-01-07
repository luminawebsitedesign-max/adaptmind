import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  ArrowLeft,
  CheckSquare,
  Target,
  Repeat,
  Calendar,
  Bot,
  Rocket,
  Sparkles
} from 'lucide-react';

interface WelcomeTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: 'Welcome to AdaptMind',
    description: 'AdaptMind is your intelligent productivity companion. Let us show you how to make the most of it.',
    icon: Sparkles,
    color: 'from-primary to-accent',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          AdaptMind helps you organize your life with tasks, habits, and goals — all enhanced by AI to give you personalized insights and suggestions.
        </p>
        <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
          <p className="text-xs text-secondary font-medium">🚀 AdaptMind is currently in beta</p>
          <p className="text-xs text-muted-foreground mt-1">
            Some features are still being refined. Your feedback helps us improve!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'tasks',
    title: 'Tasks',
    description: 'Create and organize your to-dos with priorities and due dates.',
    icon: CheckSquare,
    color: 'from-primary to-primary/70',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>• Create tasks with titles, descriptions, and due dates</p>
        <p>• Set priorities (Low, Medium, High)</p>
        <p>• Organize tasks into custom lists</p>
        <p>• Mark tasks complete and track your progress</p>
      </div>
    ),
  },
  {
    id: 'goals',
    title: 'Goals',
    description: 'Set meaningful goals and track your progress over time.',
    icon: Target,
    color: 'from-accent to-accent/70',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>• Create goals with custom timelines</p>
        <p>• Break goals into smaller milestones</p>
        <p>• Track completion percentage visually</p>
        <p>• See your goals on the calendar</p>
      </div>
    ),
  },
  {
    id: 'habits',
    title: 'Habits',
    description: 'Build positive habits and track your streaks.',
    icon: Repeat,
    color: 'from-secondary to-secondary/70',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>• Create daily, weekly, or custom habits</p>
        <p>• Build streaks by checking in consistently</p>
        <p>• Visualize your habit history</p>
        <p>• Get reminders to stay on track</p>
      </div>
    ),
  },
  {
    id: 'calendar',
    title: 'Calendar',
    description: 'View all your tasks, goals, and habits in one place.',
    icon: Calendar,
    color: 'from-primary to-accent',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>• See everything scheduled at a glance</p>
        <p>• Goals are highlighted across their duration</p>
        <p>• Tasks appear on their due dates</p>
        <p>• Click any date for detailed view</p>
      </div>
    ),
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    description: 'Get personalized help and suggestions.',
    icon: Bot,
    color: 'from-accent to-primary',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>• Ask questions about your productivity</p>
        <p>• Get help planning your week</p>
        <p>• Receive personalized suggestions</p>
        <p className="text-xs italic mt-2 text-muted-foreground/70">
          Note: AI features are in beta and continuously improving
        </p>
      </div>
    ),
  },
  {
    id: 'ready',
    title: "You're Ready!",
    description: 'Start your productivity journey with AdaptMind.',
    icon: Rocket,
    color: 'from-primary to-accent',
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          You now know the basics! Explore the app and start creating your first task, habit, or goal.
        </p>
        <p className="text-xs text-muted-foreground">
          💡 Tip: You can always access this tutorial again from Settings → Help
        </p>
      </div>
    ),
  },
];

export function WelcomeTutorial({ onComplete, onSkip }: WelcomeTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg mx-4">
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute -top-10 right-0 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Skip Tutorial
        </button>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-1.5 mb-6 relative">
            {TUTORIAL_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  index <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6 relative">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center glow-primary`}>
              <StepIcon className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>

          {/* Step Content */}
          <div className="relative min-h-[200px] flex flex-col">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-display font-bold mb-2">
                {currentStep.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                {currentStep.description}
              </p>
            </div>

            <div className="flex-1 py-4">
              {currentStep.content}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 relative">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isFirstStep}
              className={isFirstStep ? 'invisible' : ''}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <Button onClick={handleNext} className="glow-primary">
              {isLastStep ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground mt-4 relative">
            Step {currentStepIndex + 1} of {TUTORIAL_STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}