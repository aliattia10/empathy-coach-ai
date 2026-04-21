import { useCallback, useRef, useState } from "react";

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voiceURIRef = useRef<string | null>(null);
  const speakTokenRef = useRef(0);

  const getStableVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    if (voiceURIRef.current) {
      const existing = voices.find((voice) => voice.voiceURI === voiceURIRef.current);
      if (existing) return existing;
    }

    const preferred =
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en-gb")) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
      voices[0];

    voiceURIRef.current = preferred.voiceURI;
    return preferred;
  }, []);

  const splitIntoChunks = (text: string) => {
    const clean = text.trim();
    if (!clean) return [];

    const parts = clean.match(/[^.!?\n]+[.!?\n]*/g) ?? [clean];
    const chunks: string[] = [];
    let buffer = "";

    for (const part of parts) {
      if ((buffer + part).length > 260 && buffer.trim()) {
        chunks.push(buffer.trim());
        buffer = part;
      } else {
        buffer += part;
      }
    }
    if (buffer.trim()) chunks.push(buffer.trim());
    return chunks;
  };

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) return;

    const token = Date.now();
    speakTokenRef.current = token;
    window.speechSynthesis.cancel();

    const voice = getStableVoice();

    const speakChunk = (index: number) => {
      if (speakTokenRef.current !== token) return;
      if (index >= chunks.length) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utterance.lang = voice?.lang || "en-GB";
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => speakChunk(index + 1);
      utterance.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      const handleVoicesChanged = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
        if (speakTokenRef.current === token) speakChunk(0);
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    } else {
      speakChunk(0);
    }
  }, [getStableVoice]);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    speakTokenRef.current += 1;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
