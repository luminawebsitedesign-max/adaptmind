import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_LIST = [
  "📝", "📋", "✅", "📌", "🎯", "💡", "🔥", "⭐", "💪", "🏠",
  "💼", "📚", "🎨", "🎵", "🏃", "💰", "🛒", "✈️", "🎮", "🌱",
  "❤️", "🧠", "🍎", "💊", "🧘", "📱", "💻", "📧", "🗓️", "⏰",
  "🎁", "🎉", "🚀", "🌟", "🏆", "📊", "🔧", "🛠️", "📦", "🎓",
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-14 h-11 text-xl p-0 ${className}`}
          aria-label="Choose emoji"
        >
          {value || "📝"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_LIST.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onChange(emoji);
                setOpen(false);
              }}
              className="w-7 h-7 text-lg hover:bg-muted rounded transition-colors flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
