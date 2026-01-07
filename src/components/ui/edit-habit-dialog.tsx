import { useState, useEffect } from "react";
import { Habit } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconPicker } from "@/components/ui/icon-picker";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditHabitDialogProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updates: Partial<Habit>) => void;
}

export function EditHabitDialog({ habit, open, onOpenChange, onSave }: EditHabitDialogProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">("daily");
  const [customIntervalDays, setCustomIntervalDays] = useState(2);
  const [customIntervalInput, setCustomIntervalInput] = useState("2");

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setFrequency(habit.frequency);
      if (habit.customIntervalDays) {
        setCustomIntervalDays(habit.customIntervalDays);
        setCustomIntervalInput(String(habit.customIntervalDays));
      }
    }
  }, [habit]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ 
      name, 
      icon, 
      frequency,
      customIntervalDays: frequency === "custom" ? customIntervalDays : undefined,
    });
    onOpenChange(false);
  };

  if (!habit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
          <DialogDescription>
            Update your habit details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-habit-name">Name *</Label>
            <Input
              id="edit-habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Habit name"
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker value={icon} onChange={setIcon} />
            <div className="flex items-center gap-2 mt-2">
              <Label htmlFor="custom-icon" className="text-xs">Or type:</Label>
              <Input
                id="custom-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-16 text-center text-xl"
                maxLength={2}
              />
            </div>
          </div>


          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom frequency input */}
          {frequency === "custom" && (
            <div className="space-y-1 p-3 rounded-lg bg-muted/20 border border-border/50">
              <Label className="text-xs text-muted-foreground">Repeat every N days</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm">Every</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  className="w-20 text-center"
                  placeholder="2"
                  value={customIntervalInput}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === "" || /^\d+$/.test(next)) {
                      setCustomIntervalInput(next);
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseInt(customIntervalInput, 10);
                    if (!parsed || parsed < 1) {
                      setCustomIntervalInput("1");
                      setCustomIntervalDays(1);
                      return;
                    }
                    setCustomIntervalInput(String(parsed));
                    setCustomIntervalDays(parsed);
                  }}
                />
                <span className="text-sm">days</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={!name.trim()}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
