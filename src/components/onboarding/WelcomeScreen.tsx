import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight, Settings, Zap, Brain, Target } from 'lucide-react';

interface WelcomeScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

export function WelcomeScreen({ onContinue, onSkip }: WelcomeScreenProps) {
  const [language, setLanguage] = useState('en');

  const handleContinue = () => {
    // Store language preference in localStorage
    localStorage.setItem('adaptmind-language', language);
    onContinue();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl mx-4">
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
            <p className="text-lg text-muted-foreground mb-6">
              Your intelligent productivity companion for the modern age.
            </p>

            {/* What it's for */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30">
                <Target className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">Track Goals</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30">
                <Zap className="w-6 h-6 text-secondary" />
                <span className="text-sm font-medium">Build Habits</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/30">
                <Brain className="w-6 h-6 text-accent" />
                <span className="text-sm font-medium">AI Planning</span>
              </div>
            </div>

            {/* Language selector */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <label className="text-sm text-muted-foreground">
                Choose your language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Settings note */}
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Settings className="w-3 h-3" />
              You can change settings anytime in your profile
            </p>
          </div>

          {/* Action */}
          <Button
            className="w-full glow-primary"
            size="lg"
            onClick={handleContinue}
          >
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {/* Beta note */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            🚀 Beta version — thank you for being an early adopter!
          </p>
        </div>
      </div>
    </div>
  );
}
