import { Worker, Job, Queue } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { createRedisConnection } from "../config/redis";
import { sendEmail, initializeEmailService } from "../email/emailService";

const prisma = new PrismaClient();

const connection = createRedisConnection();

interface EmailJobData {
  scheduledEmailId: string;
  recipient: string;
  subject: string;
  message: string;
}

function buildEmailHtml(message: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px; margin: 20px 0; }
        .header { border-bottom: 2px solid #0891b2; padding-bottom: 16px; margin-bottom: 24px; }
        .header h1 { color: #0891b2; font-size: 20px; margin: 0; }
        .content { font-size: 15px; }
        .footer { border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ScheduledMail</h1>
        </div>
        <div class="content">
          ${message.replace(/\n/g, "<br>")}
        </div>
        <div class="footer">
          This email was sent via ScheduledMail.
        </div>
      </div>
    </body>
    </html>
  `;
}

async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { scheduledEmailId, recipient, subject, message } = job.data;

  console.log(`[Worker] Processing email job ${job.id} for ${recipient}`);

  const existing = await prisma.scheduledEmail.findUnique({
    where: { id: scheduledEmailId },
  });

  if (!existing) {
    console.warn(
      `[Worker] Skipping job ${job.id}: email ${scheduledEmailId} no longer exists in the database`
    );
    return;
  }

  if (existing.status !== "pending") {
    console.log(
      `[Worker] Skipping job ${job.id}: email ${scheduledEmailId} is already ${existing.status}`
    );
    return;
  }

  await prisma.scheduledEmail.update({
    where: { id: scheduledEmailId },
    data: { status: "processing" },
  });

  await prisma.emailLog.create({
    data: {
      scheduledEmailId,
      status: "processing",
      message: "Worker processing email",
    },
  });

  try {
    const result = await sendEmail({
      to: recipient,
      subject,
      html: buildEmailHtml(message),
    });

    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    await prisma.emailLog.create({
      data: {
        scheduledEmailId,
        status: "sent",
        message: `Email sent. Preview: ${result.previewUrl || "N/A"}`,
      },
    });

    console.log(`[Worker] Email sent: ${scheduledEmailId}`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown error";

    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: {
        status: "failed",
        failureReason: reason,
        retryCount: { increment: 1 },
      },
    });

    await prisma.emailLog.create({
      data: {
        scheduledEmailId,
        status: "failed",
        message: reason,
      },
    });

    console.error(`[Worker] Email failed: ${scheduledEmailId} - ${reason}`);
    throw error;
  }
}

async function recoverMissedDelayedJobs(): Promise<void> {
  try {
    const now = new Date();

    const pending = await prisma.scheduledEmail.findMany({
      where: { status: "pending" },
    });

    if (pending.length === 0) {
      console.log("[Worker] No pending scheduled emails to recover");
      return;
    }

    const overdue = pending.filter((e) => e.scheduledAt <= now);
    const future = pending.filter((e) => e.scheduledAt > now);

    if (overdue.length > 0) {
      console.log(
        `[Worker] Recovering ${overdue.length} overdue pending email(s)`
      );
      for (const email of overdue) {
        try {
          await sendEmail({
            to: email.recipient,
            subject: email.subject,
            html: buildEmailHtml(email.message),
          });

          await prisma.scheduledEmail.update({
            where: { id: email.id },
            data: { status: "sent", sentAt: new Date() },
          });

          await prisma.emailLog.create({
            data: {
              scheduledEmailId: email.id,
              status: "sent",
              message: "Recovered and sent after restart",
            },
          });

          console.log(
            `[Worker] Recovered and sent overdue email: ${email.id}`
          );
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unknown error";
          await prisma.scheduledEmail.update({
            where: { id: email.id },
            data: { status: "failed", failureReason: reason },
          });
          console.error(`[Worker] Recovery failed for email ${email.id}: ${reason}`);
        }
      }
    }

    if (future.length > 0) {
      console.log(
        `[Worker] Re-enqueuing ${future.length} future scheduled email(s) after restart`
      );
      const queue = new Queue("email-scheduling", { connection });
      for (const email of future) {
        const delay = email.scheduledAt.getTime() - now.getTime();
        await queue.add(
          "send-email",
          {
            scheduledEmailId: email.id,
            recipient: email.recipient,
            subject: email.subject,
            message: email.message,
          },
          {
            delay: Math.max(0, delay),
            jobId: `email-${email.id}`,
          }
        );
        console.log(
          `[Worker] Re-enqueued email ${email.id} with ${delay}ms delay`
        );
      }
      await queue.close();
    }
  } catch (error) {
    console.error("[Worker] Failed to recover scheduled emails:", error);
  }
}

let worker: Worker<EmailJobData>;

async function gracefulShutdown(): Promise<void> {
  console.log("[Worker] Shutting down gracefully...");
  if (worker) await worker.close();
  await prisma.$disconnect();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

async function startWorker(): Promise<void> {
  console.log("[Worker] Starting email scheduling worker...");

  await initializeEmailService();
  console.log("[Worker] Email service initialized");

  await recoverMissedDelayedJobs();

  worker = new Worker<EmailJobData>("email-scheduling", processEmailJob, {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  });

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed for email ${job.data.scheduledEmailId}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
  });

  worker.on("ready", () => {
    console.log("[Worker] Email worker is ready and listening for jobs");
  });
}

startWorker().catch((err) => {
  console.error("[Worker] Failed to start:", err);
  process.exit(1);
});