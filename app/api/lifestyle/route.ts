import { NextRequest, NextResponse } from "next/server";
import { generateLifestylePreview, LifestyleRequest } from "@/lib/lifestyle";

export async function POST(req: NextRequest) {
  try {
    const body: LifestyleRequest = await req.json();

    if (!body.pathway || !body.user_context) {
      return NextResponse.json(
        { error: "Missing required fields: pathway, user_context" },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    (async () => {
      try {
        await generateLifestylePreview(body, async (chunk) => {
          const safe = chunk.replace(/\n/g, "\\n");
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ chunk: safe })}\n\n`)
          );
        });
        await writer.write(encoder.encode(`data: {"done":true}\n\n`));
      } catch (err) {
        console.error("[lifestyle] LLM error:", err);
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
