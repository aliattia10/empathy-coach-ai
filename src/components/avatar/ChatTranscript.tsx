import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatFeedback } from "@/hooks/useChatSession";

export interface TranscriptMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  branchRootMessageId?: string | null;
  variantIndex?: number;
  variantTotal?: number;
  isActiveVariant?: boolean;
  feedbackCount?: number;
}

interface ChatTranscriptProps {
  messages: TranscriptMessage[];
  className?: string;
  isAdmin?: boolean;
  feedbackItemsByMessageId?: Record<string, ChatFeedback[]>;
  feedbackDrafts?: Record<
    string,
    { text: string; rating: number | null; tags: string[]; open: boolean; composing: boolean }
  >;
  onFeedbackDraftChange?: (
    messageId: string,
    next: { text: string; rating: number | null; tags: string[]; open: boolean; composing: boolean },
  ) => void;
  onSubmitFeedback?: (messageId: string) => void;
  onDeleteFeedback?: (messageId: string, feedbackId: string) => void;
  onRegenerate?: (messageId: string) => void;
  onSelectVariant?: (messageId: string) => void;
  onCycleVariant?: (messageId: string, direction: "prev" | "next") => void;
  isSubmittingFeedback?: boolean;
  isRegenerating?: boolean;
}

const FEEDBACK_TAGS = ["tone", "clarity", "empathy", "relevance", "safety", "too_long", "too_short", "other"];

export default function ChatTranscript({
  messages,
  className,
  isAdmin = false,
  feedbackItemsByMessageId = {},
  feedbackDrafts = {},
  onFeedbackDraftChange,
  onSubmitFeedback,
  onDeleteFeedback,
  onRegenerate,
  onSelectVariant,
  onCycleVariant,
  isSubmittingFeedback,
  isRegenerating,
}: ChatTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "rounded-2xl min-h-[220px] max-h-[440px] overflow-y-auto no-scrollbar space-y-3 px-1",
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
                {msg.role === "assistant" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {typeof msg.variantIndex === "number" && typeof msg.variantTotal === "number" && msg.variantTotal > 1 && (
                        <div className="inline-flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => onCycleVariant?.(msg.id, "prev")}
                          >
                            Prev
                          </Button>
                          <span className="text-[11px] text-muted-foreground px-1">
                            Response {msg.variantIndex + 1}/{msg.variantTotal}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => onCycleVariant?.(msg.id, "next")}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            onClick={() => {
                              const hasPrevious = (feedbackItemsByMessageId[msg.id] || []).length > 0;
                              const existing = feedbackDrafts[msg.id] || {
                                text: "",
                                rating: null,
                                tags: [],
                                open: false,
                                composing: !hasPrevious,
                              };
                              onFeedbackDraftChange?.(msg.id, { ...existing, open: !existing.open });
                            }}
                          >
                            Feedback {msg.feedbackCount ? `(${msg.feedbackCount})` : ""}
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            variant="secondary"
                            disabled={isRegenerating}
                            onClick={() => onRegenerate?.(msg.id)}
                          >
                            {isRegenerating ? "Regenerating..." : "Regenerate from feedback"}
                          </Button>
                        </>
                      )}
                      {!msg.isActiveVariant && (
                        <Button size="sm" variant="ghost" type="button" onClick={() => onSelectVariant?.(msg.id)}>
                          Continue from this reply
                        </Button>
                      )}
                    </div>

                    {isAdmin && feedbackDrafts[msg.id]?.open && (
                      <div className="rounded-lg border border-border/80 p-2 space-y-2 bg-card">
                        {(feedbackItemsByMessageId[msg.id] || []).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Previous feedback</p>
                            {(feedbackItemsByMessageId[msg.id] || []).map((item) => (
                              <div key={item.id} className="rounded-md border border-border p-2 text-xs space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-muted-foreground">
                                    {new Date(item.created_at).toLocaleString()}
                                  </span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDeleteFeedback?.(msg.id, item.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                                <p className="text-foreground whitespace-pre-wrap">{item.feedback_text}</p>
                                <p className="text-muted-foreground">
                                  Rating: {item.rating ?? "Not rated"} | Tags:{" "}
                                  {(item.tags || []).length ? (item.tags || []).join(", ") : "None"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {!feedbackDrafts[msg.id]?.composing ? (
                          <Button
                            size="sm"
                            type="button"
                            variant="outline"
                            onClick={() => {
                              const current = feedbackDrafts[msg.id] || {
                                text: "",
                                rating: null,
                                tags: [],
                                open: true,
                                composing: false,
                              };
                              onFeedbackDraftChange?.(msg.id, { ...current, composing: true });
                            }}
                          >
                            Add another feedback
                          </Button>
                        ) : (
                          <>
                            <Textarea
                              value={feedbackDrafts[msg.id]?.text || ""}
                              onChange={(event) =>
                                onFeedbackDraftChange?.(msg.id, {
                                  ...(feedbackDrafts[msg.id] || {
                                    text: "",
                                    rating: null,
                                    tags: [],
                                    open: true,
                                    composing: true,
                                  }),
                                  text: event.target.value,
                                })
                              }
                              placeholder="Describe what should be improved..."
                              rows={3}
                            />
                            <select
                              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                              value={feedbackDrafts[msg.id]?.rating ?? ""}
                              onChange={(event) => {
                                const raw = event.target.value;
                                onFeedbackDraftChange?.(msg.id, {
                                  ...(feedbackDrafts[msg.id] || {
                                    text: "",
                                    rating: null,
                                    tags: [],
                                    open: true,
                                    composing: true,
                                  }),
                                  rating: raw === "" ? null : Number(raw),
                                });
                              }}
                            >
                              <option value="">Select a rating (optional)</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                            <div className="flex flex-wrap gap-1">
                              {FEEDBACK_TAGS.map((tag) => {
                                const selected = (feedbackDrafts[msg.id]?.tags || []).includes(tag);
                                return (
                                  <Button
                                    key={tag}
                                    type="button"
                                    size="sm"
                                    variant={selected ? "default" : "outline"}
                                    onClick={() => {
                                      const current = feedbackDrafts[msg.id] || {
                                        text: "",
                                        rating: null,
                                        tags: [],
                                        open: true,
                                        composing: true,
                                      };
                                      const nextTags = selected
                                        ? current.tags.filter((item) => item !== tag)
                                        : [...current.tags, tag];
                                      onFeedbackDraftChange?.(msg.id, { ...current, tags: nextTags });
                                    }}
                                  >
                                    {tag}
                                  </Button>
                                );
                              })}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                type="button"
                                disabled={isSubmittingFeedback || !(feedbackDrafts[msg.id]?.text || "").trim()}
                                onClick={() => onSubmitFeedback?.(msg.id)}
                              >
                                {isSubmittingFeedback ? "Saving..." : "Save feedback"}
                              </Button>
                              <Button
                                size="sm"
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const current = feedbackDrafts[msg.id] || {
                                    text: "",
                                    rating: null,
                                    tags: [],
                                    open: true,
                                    composing: true,
                                  };
                                  onFeedbackDraftChange?.(msg.id, {
                                    ...current,
                                    text: "",
                                    rating: null,
                                    tags: [],
                                    composing: false,
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
