import { useRef, useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  downloadTranscriptPdf,
  downloadTranscriptTxt,
  type TranscriptMessageRow,
  type TranscriptSessionMeta,
} from "@/lib/exportSessionTranscript";
import { readUploadedConversationFile } from "@/lib/readUploadedConversationFile";
import { toast } from "sonner";

type Props = {
  session: TranscriptSessionMeta | null;
  messages: TranscriptMessageRow[];
  disabled?: boolean;
  onUploadAsMessage: (text: string) => void | Promise<void>;
};

export default function TrainerSessionTools({ session, messages, disabled, onUploadAsMessage }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingTxt, setDownloadingTxt] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendAfterUpload, setSendAfterUpload] = useState(true);

  const handleDownloadPdf = async () => {
    if (!session) return;
    setDownloadingPdf(true);
    try {
      downloadTranscriptPdf(session, messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not download transcript.";
      toast.error(message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadTxt = async () => {
    if (!session) return;
    setDownloadingTxt(true);
    try {
      downloadTranscriptTxt(session, messages);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not download transcript.";
      toast.error(message);
    } finally {
      setDownloadingTxt(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const messageText = await readUploadedConversationFile(file);
      if (sendAfterUpload) {
        await onUploadAsMessage(messageText);
        toast.success(`Uploaded ${file.name} and sent to the coach.`);
      } else {
        await navigator.clipboard.writeText(messageText);
        toast.success(`Uploaded ${file.name} — copied to clipboard. Paste into the chat to send.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not read that file.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-3 md:col-span-2">
      <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Trainer tools</p>
      <p className="text-sm text-muted-foreground">
        Download this session transcript or upload a text file into the conversation (scenario notes, example
        dialogue, etc.).
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-xl"
          disabled={disabled || !session || downloadingPdf}
          onClick={() => void handleDownloadPdf()}
        >
          {downloadingPdf ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1.5" />
          )}
          Download PDF
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-xl"
          disabled={disabled || !session || downloadingTxt}
          onClick={() => void handleDownloadTxt()}
        >
          {downloadingTxt ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1.5" />
          )}
          Download TXT
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-xl"
          disabled={disabled || uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <FileUp className="w-4 h-4 mr-1.5" />
          )}
          Upload file to chat
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.log,.rtf,.yaml,.yml,text/*"
          onChange={(event) => void handleFileChange(event)}
        />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="trainer-send-after-upload"
          checked={sendAfterUpload}
          onCheckedChange={(checked) => setSendAfterUpload(checked === true)}
        />
        <Label htmlFor="trainer-send-after-upload" className="text-xs font-normal leading-snug text-muted-foreground">
          Send uploaded file to the coach immediately (uncheck to copy text to clipboard instead).
        </Label>
      </div>
    </div>
  );
}
