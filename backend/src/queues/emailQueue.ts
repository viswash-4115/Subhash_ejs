import { Queue } from "bullmq";
import type IORedis from "ioredis";
import { createRedisConnection } from "../config/redis";
import { ScheduledEmail } from "../types/validation";

const connection = createRedisConnection();

const emailQueueInstance = new Queue("email-scheduling", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 86400, count: 100 },
    removeOnFail: { age: 604800, count: 50 },
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
});

export const emailQueue = {
  async addEmail(email: ScheduledEmail, delay: number): Promise<string> {
    const job = await emailQueueInstance.add(
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
      `[Queue] Job added: ${job.id} for email ${email.id}, delay: ${delay}ms`
    );
    return job.id?.toString() || "";
  },

  async removeJob(jobId: string): Promise<void> {
    const job = await emailQueueInstance.getJob(jobId);
    if (job) {
      await job.remove();
      console.log(`[Queue] Job removed: ${jobId}`);
    }
  },

  async getJobCounts(): Promise<Record<string, number>> {
    const counts = await emailQueueInstance.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed"
    );
    return counts;
  },

  getQueue(): Queue {
    return emailQueueInstance;
  },

  getConnection(): IORedis {
    return connection;
  },
};
