import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export interface TranscriptMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatTranscriptProps {
  messages: TranscriptMessage[];
  className?: string;
}

export default function ChatTranscript({ messages, className }: ChatTranscriptProps) {
  return (
    <div
      className={cn(
        "rounded-2xl min-h-[160px] max-h-[280px] overflow-y-auto space-y-3",
        className
      )}
    >
      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-foreground/70 text-center py-6">Conversation will appear here.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm max-w-[85%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-muted/80 text-foreground rounded-tl-md border border-border/50"
                )}
              >
                <div className="prose prose-sm max-w-none [&>p]:m-0 [&>p]:leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
