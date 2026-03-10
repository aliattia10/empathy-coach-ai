import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Bot, User, Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stripMarkdownForSpeech } from "@/lib/speech";

interface Props {
  role: "user" | "assistant";
  content: string;
  onSpeak?: (plainText: string) => void;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
}

export default function ChatMessage({ role, content, onSpeak, isSpeaking, onStopSpeaking }: Props) {
  const isUser = role === "user";
  const plainText = stripMarkdownForSpeech(content);
  const canSpeak = !isUser && plainText.length > 0 && (onSpeak || onStopSpeaking);

  const handleVoiceClick = () => {
    if (isSpeaking && onStopSpeaking) {
      onStopSpeaking();
    } else if (onSpeak && plainText) {
      onSpeak(plainText);
    }
  };

  return (
    <div className={cn("flex gap-3 max-w-2xl", isUser ? "ml-auto flex-row-reverse" : "")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-muted" : "gradient-hero"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary-foreground" />
        )}
      </div>
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-md"
            : "bg-card text-card-foreground shadow-soft rounded-tl-md border border-border"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="prose prose-sm max-w-none [&>p]:m-0 min-w-0 flex-1">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          {canSpeak && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleVoiceClick}
              title={isSpeaking ? "Stop speaking" : "Listen"}
              aria-label={isSpeaking ? "Stop speaking" : "Listen"}
            >
              {isSpeaking ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
