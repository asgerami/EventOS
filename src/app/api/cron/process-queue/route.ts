import { NextResponse } from "next/server";
import { processNextJobs } from "@/lib/queue";

/**
 * GET/POST /api/cron/process-queue
 * Process pending background jobs (email retries, etc.).
 * Call from Vercel Cron or external cron. Requires CRON_SECRET.
 */
export async function GET(request: Request) {
  return processQueue(request);
}

export async function POST(request: Request) {
  return processQueue(request);
}

async function processQueue(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const auth = authHeader?.replace(/^Bearer\s+/i, "") || new URL(request.url).searchParams.get("secret");

  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processNextJobs();
    return NextResponse.json({
      ok: true,
      processed: result.processed,
      failed: result.failed,
    });
  } catch (e) {
    console.error("[Cron] process-queue error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Job processing failed" },
      { status: 500 }
    );
  }
}
