import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Save, Sparkles, ChevronRight, Info, Shield } from "lucide-react";
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
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [aiPersonality, setAiPersonality] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <span>Settings</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Profile</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient-brand">Profile</h1>
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
