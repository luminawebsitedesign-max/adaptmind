import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Target, Zap, Brain } from 'lucide-react';

interface WelcomeScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onContinue, onSkip }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg mx-4">
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute -top-10 right-0 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Skip
        </button>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-8 md:p-10 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          
          {/* Icon */}
          <div className="flex justify-center mb-6 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8 relative">
            <h1 className="text-3xl font-display font-bold mb-3">
              Welcome to AdaptMind
            </h1>
            <p className="text-muted-foreground mb-6">
              Your intelligent productivity companion that helps you organize tasks, build habits, and achieve your goals with AI-powered insights.
            </p>

            {/* What it's for */}
            <div className="grid grid-cols-3 gap-3 mb-6">
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
          </div>

          {/* Action */}
          <Button
            className="w-full glow-primary"
            size="lg"
            onClick={onContinue}
          >
            Continue to App
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Beta note */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            🚀 Beta version — more features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
