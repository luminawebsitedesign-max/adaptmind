import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function ProfileView() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [aiPersonality, setAiPersonality] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load AI personality from localStorage for now
    const saved = localStorage.getItem("adaptmind-ai-personality");
    if (saved) setAiPersonality(saved);
  }, []);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

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

      // Save AI personality locally
      localStorage.setItem("adaptmind-ai-personality", aiPersonality);
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gradient-cyan">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account and AI preferences</p>
      </div>

      {/* Profile Info */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your basic profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted/20"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we call you?"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Personalization */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Personalization
          </CardTitle>
          <CardDescription>
            Tell the AI about yourself to get more personalized advice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aiPersonality">About Me & AI Preferences</Label>
            <Textarea
              id="aiPersonality"
              value={aiPersonality}
              onChange={(e) => setAiPersonality(e.target.value)}
              placeholder="Example: I'm a morning person who works best with short focused sessions. I prefer direct, no-nonsense advice. My main goals are career growth and fitness. Please be encouraging but not pushy."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              The AI will use this to tailor its responses, suggestions, and tone to match your preferences.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-medium text-sm mb-2">Tips for better AI personalization:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Share your work style (morning/night person, focus duration)</li>
              <li>• Mention your main priorities and goals</li>
              <li>• Describe the tone you prefer (formal, casual, encouraging)</li>
              <li>• Note any specific areas you want to improve</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={isSaving}
        className="w-full gap-2"
      >
        {isSaving ? (
          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Save Changes
      </Button>
    </div>
  );
}
