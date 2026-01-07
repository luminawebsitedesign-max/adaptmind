import { IconPicker } from "@/components/ui/icon-picker";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

/**
 * Backwards-compatible wrapper.
 * Use IconPicker for all new code.
 */
export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  return (
    <IconPicker
      value={value}
      onChange={onChange}
      className={className}
      ariaLabel="Choose emoji"
    />
  );
}

