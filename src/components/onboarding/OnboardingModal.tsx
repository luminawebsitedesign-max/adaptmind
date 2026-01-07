import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Target, 
  Zap, 
  Brain,
  CheckSquare,
  Calendar,
  Bot,
  Rocket
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';

interface OnboardingModalProps {
  onComplete: () => void;
}

const STEPS = ['welcome', 'features', 'preferences', 'getStarted'] as const;
type Step = typeof STEPS[number];

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [language, setLanguage] = useState('en');
  const { setCurrentView } = useAppStore();

  const currentIndex = STEPS.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEPS.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleCreateTask = () => {
    onComplete();
    setCurrentView('todos');
  };

  const handleCreateHabit = () => {
    onComplete();
    setCurrentView('habits');
  };

  const handleGoToDashboard = () => {
    onComplete();
    setCurrentView('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg mx-4">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute -top-10 right-0 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Skip
        </button>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-6 relative">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  index <= currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="relative min-h-[320px] flex flex-col">
            {currentStep === 'welcome' && <WelcomeStep />}
            {currentStep === 'features' && <FeaturesStep />}
            {currentStep === 'preferences' && (
              <PreferencesStep language={language} setLanguage={setLanguage} />
            )}
            {currentStep === 'getStarted' && (
              <GetStartedStep 
                onCreateTask={handleCreateTask}
                onCreateHabit={handleCreateHabit}
                onSkip={handleGoToDashboard}
              />
            )}
          </div>

          {/* Navigation */}
          {currentStep !== 'getStarted' && (
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
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Don't show again checkbox */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/50 relative">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label
              htmlFor="dontShowAgain"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Don't show this again
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Beta Badge */}
      <div className="mb-4">
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-secondary/20 text-secondary border border-secondary/30">
          Beta
        </span>
      </div>

      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary mb-6">
        <Sparkles className="w-8 h-8 text-primary-foreground" />
      </div>

      <h1 className="text-3xl font-display font-bold mb-3">
        Welcome to AdaptMind
      </h1>
      
      <p className="text-muted-foreground mb-6">
        Your intelligent productivity companion. Track tasks, build habits, and achieve goals — with AI guidance along the way.
      </p>

      {/* What it's for */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30">
          <Target className="w-5 h-5 text-primary" />
          <span className="text-xs font-medium">Goals</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30">
          <Zap className="w-5 h-5 text-secondary" />
          <span className="text-xs font-medium">Habits</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30">
          <Brain className="w-5 h-5 text-accent" />
          <span className="text-xs font-medium">AI Assistant</span>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground mt-6 bg-muted/20 rounded-lg p-3">
        <p className="font-medium mb-1">🚀 You're using an early beta</p>
        <p>Some features are still being refined. Your feedback helps us improve!</p>
      </div>
    </div>
  );
}

function FeaturesStep() {
  const features = [
    {
      icon: CheckSquare,
      title: 'Tasks',
      description: 'Create and organize your to-dos with priorities.',
      color: 'text-primary',
      status: 'ready'
    },
    {
      icon: Zap,
      title: 'Habits',
      description: 'Track daily habits and build streaks.',
      color: 'text-secondary',
      status: 'ready'
    },
    {
      icon: Calendar,
      title: 'Calendar',
      description: 'View tasks and habits by date.',
      color: 'text-accent',
      status: 'ready'
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Get planning help and suggestions. Automation coming soon.',
      color: 'text-primary',
      status: 'beta'
    }
  ];

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-display font-bold mb-2 text-center">
        What You Can Do
      </h2>
      <p className="text-muted-foreground text-center text-sm mb-6">
        Core features available now
      </p>

      <div className="space-y-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/30"
          >
            <div className={`mt-0.5 ${feature.color}`}>
              <feature.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{feature.title}</h3>
                {feature.status === 'beta' && (
                  <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded bg-muted text-muted-foreground">
                    Beta
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PreferencesStepProps {
  language: string;
  setLanguage: (lang: string) => void;
}

function PreferencesStep({ language, setLanguage }: PreferencesStepProps) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-display font-bold mb-2 text-center">
        Your Preferences
      </h2>
      <p className="text-muted-foreground text-center text-sm mb-8">
        Set up your preferences to personalize your experience
      </p>

      <div className="w-full max-w-xs space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Language</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-xs text-muted-foreground text-center bg-muted/30 p-3 rounded-lg">
          💡 You can change these settings anytime in your profile
        </p>
      </div>
    </div>
  );
}

interface GetStartedStepProps {
  onCreateTask: () => void;
  onCreateHabit: () => void;
  onSkip: () => void;
}

function GetStartedStep({ onCreateTask, onCreateHabit, onSkip }: GetStartedStepProps) {
  return (
    <div className="flex flex-col items-center">
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary mb-6">
        <Rocket className="w-7 h-7 text-primary-foreground" />
      </div>

      <h2 className="text-2xl font-display font-bold mb-2 text-center">
        Let's Get Started!
      </h2>
      <p className="text-muted-foreground text-center text-sm mb-8">
        Start your productivity journey by creating your first task or habit
      </p>

      <div className="w-full space-y-3">
        <Button
          className="w-full glow-primary"
          size="lg"
          onClick={onCreateTask}
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          Create my first task
        </Button>

        <Button
          variant="outline"
          className="w-full"
          size="lg"
          onClick={onCreateHabit}
        >
          <Zap className="w-4 h-4 mr-2" />
          Start a new habit
        </Button>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={onSkip}
        >
          Skip and go to dashboard
        </Button>
      </div>
    </div>
  );
}
