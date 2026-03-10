import { useCallback, useEffect, useRef, useState } from "react";

/** Browser SpeechRecognition (Chrome/Edge). Use for live transcription. */
function getSpeechRecognition(): typeof window.SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface UseSpeechRecognitionOptions {
  /** Callback when user stops speaking and we have a final transcript. */
  onFinalTranscript?: (text: string) => void;
  /** Language (default en-GB). */
  lang?: string;
  /** Request continuous results (default true for live transcript). */
  continuous?: boolean;
  /** Request interim results (default true for live display). */
  interimResults?: boolean;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    onFinalTranscript,
    lang = "en-GB",
    continuous = true,
    interimResults = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalRef = useRef(onFinalTranscript);
  const accumulatedRef = useRef("");
  onFinalRef.current = onFinalTranscript;

  const start = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setError("Speech recognition not supported in this browser. Try Chrome or Edge.");
      return false;
    }
    setError(null);
    setLiveTranscript("");
    setInterimTranscript("");
    accumulatedRef.current = "";
    const recognition = new SR();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) final += text;
        else interim += text;
      }
      if (interim) setInterimTranscript(interim);
      if (final) {
        const trimmed = final.trim();
        accumulatedRef.current = (accumulatedRef.current + " " + trimmed).trim();
        setLiveTranscript(accumulatedRef.current);
        setInterimTranscript("");
        if (trimmed) onFinalRef.current?.(trimmed);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(e.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      return true;
    } catch (err) {
      setError("Could not start microphone.");
      return false;
    }
  }, [continuous, interimResults, lang]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const displayTranscript = [liveTranscript, interimTranscript].filter(Boolean).join(" ").trim();

  return {
    isListening,
    liveTranscript,
    interimTranscript,
    displayTranscript,
    error,
    start,
    stop,
    supported: typeof window !== "undefined" && !!getSpeechRecognition(),
  };
}
