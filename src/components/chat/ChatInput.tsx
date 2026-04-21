import { useRef, useState, KeyboardEvent } from "react";
import { Loader2, Mic, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onSend: (message: string) => void;
  onTranscribeAudio?: (blob: Blob, mimeType: string) => Promise<string>;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onTranscribeAudio, disabled }: Props) {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const canUseRecorder =
    typeof window !== "undefined" &&
    !!window.MediaRecorder &&
    !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getUserMedia;

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

  const startRecording = async () => {
    if (!onTranscribeAudio || !canUseRecorder || disabled || isTranscribing) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());
        if (blob.size === 0) return;
        setIsTranscribing(true);
        try {
          const text = await onTranscribeAudio(blob, "audio/webm");
          if (text.trim()) onSend(text.trim());
        } finally {
          setIsTranscribing(false);
        }
      };
      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
    } catch {
      setIsRecording(false);
      setRecorder(null);
    }
  };

  const stopRecording = () => {
    if (!recorder) return;
    recorder.stop();
    setIsRecording(false);
    setRecorder(null);
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
        disabled={disabled || isTranscribing}
      />
      {onTranscribeAudio && canUseRecorder && (
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isTranscribing}
          className="rounded-xl shrink-0"
          title={isRecording ? "Stop recording" : "Record voice message"}
        >
          {isTranscribing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <Square className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
      )}
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!value.trim() || disabled || isTranscribing}
        className="rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
