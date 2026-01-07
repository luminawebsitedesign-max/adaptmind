import { useMemo, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowRight, Globe, Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Input validation schema - security hardening
const welcomeFormSchema = z.object({
  language: z.string().min(2).max(10).default('en'),
  primaryUse: z.string().max(50).optional(),
  primaryUseOther: z.string().max(200).optional(),
  userNotes: z.string().max(500).optional(),
});

interface WelcomeFormModalProps {
  onComplete: (data: WelcomeFormData) => void;
  onSkip: () => void;
}

export interface WelcomeFormData {
  language: string;
  primaryUse: string;
  userNotes: string;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
];

const PRIMARY_USES = [
  { value: 'productivity', label: 'Productivity & Task Management' },
  { value: 'habits', label: 'Building Better Habits' },
  { value: 'goals', label: 'Goal Tracking & Achievement' },
  { value: 'mixed', label: 'All of the Above' },
  { value: 'other', label: 'Something Else' },
];

export function WelcomeFormModal({ onComplete, onSkip }: WelcomeFormModalProps) {
  const [language, setLanguage] = useState('en');
  const [primaryUse, setPrimaryUse] = useState('');
  const [primaryUseOther, setPrimaryUseOther] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const combinedUserNotes = useMemo(() => {
    const trimmedNotes = userNotes.trim();
    const trimmedOther = primaryUseOther.trim();

    if (primaryUse !== 'other' || !trimmedOther) return trimmedNotes;

    const otherLine = `Primary use (custom): ${trimmedOther}`;
    if (!trimmedNotes) return otherLine;
    return `${trimmedNotes}\n\n${otherLine}`;
  }, [primaryUse, primaryUseOther, userNotes]);

  const handleContinue = async () => {
    if (isSubmitting) return;
    
    // Validate inputs
    const validation = welcomeFormSchema.safeParse({
      language,
      primaryUse,
      primaryUseOther,
      userNotes,
    });
    
    if (!validation.success) {
      toast.error('Please check your inputs and try again');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onComplete({
        language: language.trim(),
        primaryUse: primaryUse.trim(),
        userNotes: combinedUserNotes.trim(),
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSkip();
    } catch (error) {
      console.error('Error skipping form:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg mx-4">

        {/* Card */}
        <div className="glass-strong rounded-3xl p-6 md:p-10 relative overflow-hidden max-h-[calc(100vh-3rem)] overflow-y-auto">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />

          {/* Skip button */}
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-sm transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
          
          {/* Beta Badge */}
          <div className="flex justify-center mb-4 relative">
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-secondary/20 text-secondary border border-secondary/30">
              Beta
            </span>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6 relative">
            <h1 className="text-2xl font-display font-bold mb-2">
              Welcome to AdaptMind!
            </h1>
            <p className="text-muted-foreground text-sm">
              Let's personalize your experience
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5 relative">
            {/* Language Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4 text-primary" />
                Preferred Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full">
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

            {/* Primary Use */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4 text-accent" />
                How will you use AdaptMind?
              </Label>
              <Select value={primaryUse} onValueChange={setPrimaryUse}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your primary use" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_USES.map((use) => (
                    <SelectItem key={use.value} value={use.value}>
                      {use.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* "Something Else" details */}
            {primaryUse === 'other' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tell us how you plan to use AdaptMind{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  value={primaryUseOther}
                  onChange={(e) => setPrimaryUseOther(e.target.value)}
                  placeholder="E.g., finance tracking, study planning, health routines..."
                  maxLength={200}
                />
              </div>
            )}

            {/* User Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Anything you'd like AdaptMind to know?{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="E.g., I'm a morning person, I prefer short tasks, I want to focus on fitness..."
                rows={3}
                className="resize-none"
                maxLength={500}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 relative">
            <Button
              className="w-full glow-primary"
              size="lg"
              onClick={handleContinue}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Note */}
          <p className="text-center text-xs text-muted-foreground mt-4 relative">
            You can change these settings anytime in your profile
          </p>
        </div>
      </div>
    </div>
  );
}