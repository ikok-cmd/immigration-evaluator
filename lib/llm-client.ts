/**
 * Minimal OpenAI-compatible chat-completions streaming client.
 *
 * Uses only fetch + Web Streams APIs — no Node.js dependencies — so it
 * runs cleanly in Cloudflare Workers / Edge runtimes where the official
 * `openai` SDK has bundling issues.
 */

export interface StreamChatOptions {
  system: string;
  user: string;
  maxTokens?: number;
  onChunk?: (delta: string) => void;
}

export async function streamChatCompletion(opts: StreamChatOptions): Promise<void> {
  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL || "https://api.deepseek.com/v1";
  const model = process.env.LLM_MODEL || "deepseek-chat";

  if (!apiKey) {
    throw new Error("LLM_API_KEY environment variable is not set");
  }

  const response = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: opts.maxTokens ?? 8000,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`LLM API ${response.status}: ${text.slice(0, 300)}`);
  }
  if (!response.body) {
    throw new Error("LLM response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // keep the (possibly partial) last line in buffer for the next iteration
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          opts.onChunk?.(delta);
        }
      } catch {
        // ignore malformed lines
      }
    }
  }
}
