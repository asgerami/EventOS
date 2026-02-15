/**
 * Simple database-backed job queue.
 * Process jobs via GET /api/cron/process-queue (call with CRON_SECRET).
 */

import { prisma } from "@/lib/db";
import { sendTicketEmail } from "@/lib/email";

const BATCH_SIZE = 20;

export type JobType = "send_ticket_email";

export type SendTicketEmailPayload = {
  to: string;
  attendeeName: string;
  eventName: string;
  ticketUrl: string;
  ticketTypeName: string;
};

export async function enqueueJob(
  type: JobType,
  payload: SendTicketEmailPayload,
  options?: { runAt?: Date }
) {
  return prisma.job.create({
    data: {
      type,
      payload: payload as unknown as object,
      runAt: options?.runAt ?? new Date(),
    },
  });
}

export async function processNextJobs(): Promise<{ processed: number; failed: number }> {
  const now = new Date();
  const jobs = await prisma.job.findMany({
    where: {
      status: "pending",
      runAt: { lte: now },
      attempts: { lt: 5 },
    },
    take: BATCH_SIZE,
    orderBy: { runAt: "asc" },
  });

  let processed = 0;
  let failed = 0;

  for (const job of jobs) {
    if (job.attempts >= job.maxAttempts) continue;
    try {
      await prisma.job.update({
        where: { id: job.id },
        data: { attempts: { increment: 1 }, updatedAt: new Date() },
      });

      if (job.type === "send_ticket_email") {
        const payload = job.payload as unknown as SendTicketEmailPayload;
        const ok = await sendTicketEmail(payload);
        if (ok) {
          await prisma.job.update({
            where: { id: job.id },
            data: { status: "completed", updatedAt: new Date() },
          });
          processed++;
        } else {
          const nextRun = new Date(Date.now() + Math.pow(2, job.attempts) * 60 * 1000);
          await prisma.job.update({
            where: { id: job.id },
            data: {
              status: job.attempts + 1 >= job.maxAttempts ? "failed" : "pending",
              lastError: "sendTicketEmail returned false",
              runAt: nextRun,
              updatedAt: new Date(),
            },
          });
          failed++;
        }
      } else {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: "failed", lastError: `Unknown job type: ${job.type}`, updatedAt: new Date() },
        });
        failed++;
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const nextRun = new Date(Date.now() + Math.pow(2, job.attempts) * 60 * 1000);
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: job.attempts + 1 >= job.maxAttempts ? "failed" : "pending",
          lastError: errMsg.slice(0, 500),
          runAt: nextRun,
          updatedAt: new Date(),
        },
      });
      failed++;
    }
  }

  return { processed, failed };
}
