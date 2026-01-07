import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { useAppStore } from "@/stores/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { User, Save, Sparkles, ChevronRight, Info, Shield, Moon, Sun, Calendar, ExternalLink, HelpCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_PERSONALITY_LENGTH = 1000;

export function ProfileView() {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setShowManualTutorial } = useAppStore();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [aiPersonality, setAiPersonality] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("adaptmind-ai-personality");
    if (saved) setAiPersonality(saved);
  }, []);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  // Track unsaved changes
  useEffect(() => {
    const savedPersonality = localStorage.getItem("adaptmind-ai-personality") || "";
    const originalName = profile?.display_name || "";
    setHasUnsavedChanges(
      displayName !== originalName || aiPersonality !== savedPersonality
    );
  }, [displayName, aiPersonality, profile]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      localStorage.setItem("adaptmind-ai-personality", aiPersonality);
      setHasUnsavedChanges(false);
      
      toast.success("Profile saved successfully", {
        description: "Your changes have been applied.",
        duration: 4000,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to save profile", {
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const remainingChars = MAX_PERSONALITY_LENGTH - aiPersonality.length;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <span>Settings</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Profile</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient-brand">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account information and AI preferences</p>
      </div>

      {/* Account Information Card */}
      <Card className="glass-strong border-border/40">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            Account Information
          </CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-muted/30 text-muted-foreground cursor-not-allowed"
                aria-describedby="email-help"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Email change info">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>To change your email, please contact support or update it in your authentication provider settings.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p id="email-help" className="text-xs text-muted-foreground">
              Email is linked to your authentication and cannot be changed here.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-medium">
              Display Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your preferred name"
              className="bg-input/50 focus:bg-input"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              This name will appear throughout the app and in AI conversations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Card */}
      <Card className="glass-strong border-border/40">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            {mounted && theme === 'dark' ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how AdaptMind looks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Light Mode</Label>
              <p className="text-xs text-muted-foreground">
                Enable light theme (Dark Mode is default)
              </p>
            </div>
            <Switch
              checked={mounted && theme === 'light'}
              onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')}
              aria-label="Toggle light mode"
            />
          </div>
        </CardContent>
      </Card>

      {/* Integrations Card */}
      <Card className="glass-strong border-border/40">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Integrations
          </CardTitle>
          <CardDescription>
            Connect external services to enhance your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm">Google Calendar</p>
                <p className="text-xs text-muted-foreground">Sync events with your calendar</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10"
              onClick={() => {
                toast.info("Google Calendar integration", {
                  description: "This feature will be available soon.",
                });
              }}
            >
              <ExternalLink className="w-4 h-4" />
              Connect
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            More integrations coming soon
          </p>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="glass-strong border-border/40">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="w-5 h-5 text-primary" />
            Help
          </CardTitle>
          <CardDescription>
            Resources and tutorials to help you get the most out of AdaptMind
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Welcome Tutorial</p>
                <p className="text-xs text-muted-foreground">Learn how to use AdaptMind features</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10"
              onClick={() => setShowManualTutorial(true)}
            >
              Run Tutorial
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Personalization Card */}
      <Card className="glass-strong border-border/40">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Personalization
          </CardTitle>
          <CardDescription>
            Help the AI understand you better for more personalized assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="aiPersonality" className="text-sm font-medium">
              About Me & Preferences
            </Label>
            <Textarea
              id="aiPersonality"
              value={aiPersonality}
              onChange={(e) => setAiPersonality(e.target.value.slice(0, MAX_PERSONALITY_LENGTH))}
              placeholder="Describe your work style, personal goals, and preferred tone for AI assistance. For example: 'I'm a morning person who prefers focused 25-minute work sessions. I like direct, actionable advice. My main priorities are career growth and maintaining work-life balance. Please be encouraging but not pushy.'"
              rows={5}
              className="resize-none bg-input/50 focus:bg-input"
              aria-describedby="personality-help"
            />
            <div className="flex items-center justify-between">
              <p id="personality-help" className="text-xs text-muted-foreground">
                {remainingChars} characters remaining
              </p>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
            <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Privacy:</strong> This information is stored locally and used only to personalize your AI interactions. Avoid including sensitive personal data like passwords or financial details.
            </p>
          </div>

          {/* Tips Section */}
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <h4 className="font-medium text-sm text-accent mb-3">Tips for better AI personalization</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Share your <strong className="text-foreground">work style</strong> — are you a morning person? Do you prefer short bursts or long deep-work sessions?</li>
              <li>Mention your <strong className="text-foreground">main priorities</strong> — career, health, learning, relationships, or personal projects.</li>
              <li>Describe your <strong className="text-foreground">preferred communication tone</strong> — formal, casual, encouraging, direct, or playful.</li>
              <li>Note any <strong className="text-foreground">specific areas</strong> you want to improve — time management, habit building, goal tracking, etc.</li>
            </ol>
            <p className="text-xs text-muted-foreground/80 mt-3">
              The AI uses this across all modules: Tasks, Goals, Habits, Finance, and the AI Assistant.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !hasUnsavedChanges}
          className="gap-2 min-w-[140px]"
          size="lg"
        >
          {isSaving ? (
            <>
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </Button>
        {hasUnsavedChanges && (
          <span className="text-sm text-muted-foreground">You have unsaved changes</span>
        )}
      </div>
    </div>
  );
}
