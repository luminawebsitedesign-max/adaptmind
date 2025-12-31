import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/appStore';
import { CheckSquare, Repeat, ArrowRight, X } from 'lucide-react';

interface FirstActionGuideProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function FirstActionGuide({ onComplete, onSkip }: FirstActionGuideProps) {
  const { setCurrentView } = useAppStore();

  const handleCreateTask = () => {
    setCurrentView('todos');
    onComplete();
  };

  const handleCreateHabit = () => {
    setCurrentView('habits');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md mx-4">
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute -top-10 right-0 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
        >
          Skip <X className="w-4 h-4" />
        </button>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          
          {/* Content */}
          <div className="text-center mb-8 relative">
            <h2 className="text-2xl font-display font-bold mb-3">
              Let's get started!
            </h2>
            <p className="text-muted-foreground">
              What would you like to create first?
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 relative">
            <Button
              variant="outline"
              className="w-full h-auto py-4 px-5 justify-start gap-4 hover:bg-primary/10 hover:border-primary/50 transition-all"
              onClick={handleCreateTask}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="font-medium">Create a Task</div>
                <div className="text-xs text-muted-foreground">
                  Add something to your to-do list
                </div>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="w-full h-auto py-4 px-5 justify-start gap-4 hover:bg-accent/10 hover:border-accent/50 transition-all"
              onClick={handleCreateHabit}
            >
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Repeat className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <div className="font-medium">Start a Habit</div>
                <div className="text-xs text-muted-foreground">
                  Build a daily routine
                </div>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
            </Button>
          </div>

          {/* Hint */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            You can always explore other features from the sidebar
          </p>
        </div>
      </div>
    </div>
  );
}
