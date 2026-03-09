import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export default function ChatMessage({ role, content }: Props) {
  const isUser = role === "user";

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
        <div className="prose prose-sm max-w-none [&>p]:m-0">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
