import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 items-end bg-card border border-border rounded-2xl p-2 shadow-soft">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the situation you're navigating..."
        rows={1}
        className="flex-1 resize-none bg-transparent text-sm px-2 py-2 outline-none text-foreground placeholder:text-muted-foreground"
        disabled={disabled}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
