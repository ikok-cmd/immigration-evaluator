/**
 * 通用 SSE 客户端：POST 到指定 url，按 `data: {chunk: "..."}\n\n` 帧累积文本，
 * 收到 `data: {"done":true}` 后从累积文本中解析 JSON 返回。
 *
 * 服务端约定（见 app/api/evaluate/route.ts、app/api/prepare/route.ts）：
 * - 每个 chunk 帧：`data: {"chunk": "<text with \\n escaped>"}\n\n`
 * - 结束帧：`data: {"done":true}\n\n`
 * - 错误帧：`data: {"error":"<message>"}\n\n`
 */
export async function streamSSE<T>(
  url: string,
  body: unknown,
  opts?: { signal?: AbortSignal; onProgress?: (accumulated: string) => void }
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts?.signal,
  });

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";
  let sseBuffer = "";

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    sseBuffer += decoder.decode(value, { stream: true });

    const parts = sseBuffer.split("\n\n");
    sseBuffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.error) throw new Error(String(data.error));
        if (data.chunk) {
          accumulated += data.chunk.replace(/\\n/g, "\n");
          opts?.onProgress?.(accumulated);
        }
        if (data.done) break outer;
      } catch (parseErr) {
        // re-throw API-emitted error; ignore malformed frames otherwise
        if (parseErr instanceof Error && parseErr.message && !parseErr.message.startsWith("Unexpected")) {
          throw parseErr;
        }
      }
    }
  }

  if (!accumulated.trim()) {
    throw new Error("Empty response from server");
  }

  const cleaned = accumulated
    .trim()
    .replace(/^```json\s*/, "")
    .replace(/```\s*$/, "");

  return JSON.parse(cleaned) as T;
}
