/**
 * RunPod Serverless async /run + /status — avoids long-held Netlify connections during cold start.
 */

function parseRunPodEndpointId(vllmApiUrl) {
  const match = String(vllmApiUrl || "").match(/api\.runpod\.ai\/v2\/([^/]+)/i);
  return match?.[1] || null;
}

function runPodApiBase(endpointId) {
  return `https://api.runpod.ai/v2/${endpointId}`;
}

function toRunPodSamplingParams(sampling) {
  return {
    temperature: sampling.temperature,
    max_tokens: sampling.max_tokens,
    presence_penalty: sampling.presence_penalty,
    frequency_penalty: sampling.frequency_penalty,
    repetition_penalty: sampling.repetition_penalty,
  };
}

function buildRunPodInput(messages, sampling) {
  return {
    input: {
      messages: messages.map((m) => ({ role: m.role, content: m.content || "" })),
      sampling_params: toRunPodSamplingParams(sampling),
    },
  };
}

function extractReplyFromRunPodOutput(output) {
  if (!output) return "";

  if (typeof output === "string") return output.trim();

  if (typeof output.text === "string") return output.text.trim();

  const choices = output.choices || output.output?.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0];
    if (typeof first.message?.content === "string") return first.message.content.trim();
    if (typeof first.text === "string") return first.text.trim();
    if (Array.isArray(first.tokens)) return first.tokens.join("").trim();
    if (typeof first.tokens === "string") return first.tokens.trim();
  }

  if (Array.isArray(output) && output.length > 0) {
    return extractReplyFromRunPodOutput(output[0]);
  }

  return "";
}

async function submitRunPodJob(endpointId, apiKey, messages, sampling, timeoutMs = 30000) {
  const url = `${runPodApiBase(endpointId)}/run`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(buildRunPodInput(messages, sampling)),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`RunPod /run invalid JSON (${res.status}): ${text.slice(0, 400)}`);
  }

  if (!res.ok) {
    throw new Error(`RunPod /run ${res.status}: ${text.slice(0, 400)}`);
  }

  const jobId = data.id;
  if (!jobId) {
    throw new Error("RunPod /run returned no job id");
  }

  return jobId;
}

async function pollRunPodJob(endpointId, apiKey, jobId, timeoutMs = 20000) {
  const url = `${runPodApiBase(endpointId)}/status/${jobId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
    signal: AbortSignal.timeout(timeoutMs),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`RunPod /status invalid JSON (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(`RunPod /status ${res.status}: ${text.slice(0, 400)}`);
  }

  return data;
}

function useRunPodAsync(vllmApiUrl) {
  if (process.env.RUNPOD_ASYNC === "false") return false;
  return String(vllmApiUrl || "").includes("runpod.ai");
}

module.exports = {
  parseRunPodEndpointId,
  runPodApiBase,
  buildRunPodInput,
  extractReplyFromRunPodOutput,
  submitRunPodJob,
  pollRunPodJob,
  useRunPodAsync,
};
