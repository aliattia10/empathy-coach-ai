const DEFAULT_GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const DEFAULT_OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";

function decodeBase64ToUint8Array(base64) {
  const binary = Buffer.from(base64, "base64");
  return new Uint8Array(binary);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { audioBase64, mimeType } = body;
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return { statusCode: 400, body: JSON.stringify({ error: "audioBase64 is required." }) };
  }

  const preferOpenAI = (process.env.TRANSCRIBE_PROVIDER || "").toLowerCase() === "openai";
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const useOpenAI = preferOpenAI ? !!openaiKey : !groqKey && !!openaiKey;
  const url = useOpenAI ? DEFAULT_OPENAI_TRANSCRIBE_URL : DEFAULT_GROQ_TRANSCRIBE_URL;
  const apiKey = useOpenAI ? openaiKey : groqKey;
  const model = useOpenAI
    ? (process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1")
    : (process.env.GROQ_TRANSCRIBE_MODEL || "whisper-large-v3-turbo");

  if (!apiKey) {
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: "Transcription is unavailable. Configure GROQ_API_KEY or OPENAI_API_KEY.",
      }),
    };
  }

  try {
    const bytes = decodeBase64ToUint8Array(audioBase64);
    const blob = new Blob([bytes], { type: mimeType || "audio/webm" });
    const formData = new FormData();
    formData.append("file", blob, "voice-message.webm");
    formData.append("model", model);
    formData.append("language", "en");

    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Transcription provider error:", response.status, errorText);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Transcription failed at provider." }),
      };
    }

    const data = await response.json();
    const text = (data.text || "").trim();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };
  } catch (error) {
    console.error("Transcription function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Transcription failed due to server error." }),
    };
  }
};
