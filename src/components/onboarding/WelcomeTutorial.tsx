import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowRight, 
  ArrowLeft,
  CheckSquare,
  Target,
  Repeat,
  Calendar,
  Wallet,
  Bot,
  Rocket,
  Sparkles,
  User
} from 'lucide-react';

interface WelcomeTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
  onSavePreferences?: (language: string, usage: string) => void;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
  { value: 'it', label: 'Italiano' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'pl', label: 'Polski' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'ko', label: '한국어' },
];

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  content: React.ReactNode;
  isFormStep?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
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
    id: 'personalize',
    title: 'Personalize Your Experience',
    description: 'Help us tailor AdaptMind to your needs.',
    icon: User,
    color: 'from-secondary to-accent',
    content: null, // Special handling for form step
    isFormStep: true,
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
    id: 'finance',
    title: 'Finance',
    description: 'Track your finances and portfolios.',
    icon: Wallet,
    color: 'from-secondary to-primary',
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>• Create portfolios to organize your assets</p>
        <p>• Track assets and categories</p>
        <p>• Monitor progress over time</p>
        <p>• Finance integrates with your productivity system</p>
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

export function WelcomeTutorial({ onComplete, onSkip, onSavePreferences }: WelcomeTutorialProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [usageDescription, setUsageDescription] = useState('');
  
  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    // If leaving the personalize step, save preferences
    if (currentStep.isFormStep && onSavePreferences) {
      onSavePreferences(selectedLanguage, usageDescription);
    }
    
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

  // Render the personalization form step
  const renderFormStep = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="language" className="text-sm font-medium">
          Preferred Language
        </Label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger id="language" className="w-full">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="usage" className="text-sm font-medium">
          What are you using AdaptMind for? <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="usage"
          placeholder="e.g., Work productivity, personal goals, habit tracking..."
          value={usageDescription}
          onChange={(e) => setUsageDescription(e.target.value)}
          className="w-full"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          This helps our AI give you better suggestions
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg mx-4">
        {/* Card */}
        <div className="glass-strong rounded-3xl p-6 md:p-10 relative overflow-hidden max-h-[calc(100vh-3rem)] flex flex-col">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />

          {/* Skip button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-sm transition-colors z-10"
          >
            Skip Tutorial
          </button>
          
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
          <div className="relative min-h-0 flex-1 flex flex-col overflow-y-auto">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-display font-bold mb-2">
                {currentStep.title}
              </h2>
              <p className="text-muted-foreground text-sm">
                {currentStep.description}
              </p>
            </div>

            <div className="flex-1 py-4">
              {currentStep.isFormStep ? renderFormStep() : currentStep.content}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 relative shrink-0">
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
