import { NextRequest, NextResponse } from "next/server";
import { evaluateImmigration } from "@/lib/claude";
import { UserFormData } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const formData: UserFormData = await req.json();

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      try {
        await evaluateImmigration(formData, async (chunk) => {
          // escape newlines so SSE frame is never broken
          const safe = chunk.replace(/\n/g, "\\n");
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ chunk: safe })}\n\n`)
          );
        });
        // client accumulates chunks and parses JSON itself
        await writer.write(encoder.encode(`data: {"done":true}\n\n`));
      } catch (err) {
        console.error("[evaluate] LLM error:", err);
        const msg = err instanceof Error ? err.message : String(err);
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
