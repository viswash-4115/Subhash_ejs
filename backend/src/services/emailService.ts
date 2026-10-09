import prisma from "../config/database";
import { CreateScheduledEmailInput, UpdateScheduledEmailInput } from "../types/validation";
import { ScheduledEmail } from "../types/validation";

function formatEmail(record: Record<string, unknown>): ScheduledEmail {
  return {
    id: record.id as string,
    recipient: record.recipient as string,
    subject: record.subject as string,
    message: record.message as string,
    scheduledAt: (record.scheduledAt as Date).toISOString(),
    status: record.status as string,
    jobId: (record.jobId as string) || null,
    sentAt: record.sentAt ? (record.sentAt as Date).toISOString() : null,
    failureReason: (record.failureReason as string) || null,
    retryCount: record.retryCount as number,
    createdAt: (record.createdAt as Date).toISOString(),
    updatedAt: (record.updatedAt as Date).toISOString(),
  };
}

export const emailService = {
  async create(data: CreateScheduledEmailInput): Promise<ScheduledEmail> {
    const record = await prisma.scheduledEmail.create({
      data: {
        recipient: data.recipient,
        subject: data.subject,
        message: data.message,
        scheduledAt: new Date(data.scheduledAt),
        status: "pending",
      },
    });

    await prisma.emailLog.create({
      data: {
        scheduledEmailId: record.id,
        status: "pending",
        message: "Email scheduled",
      },
    });

    return formatEmail(record as unknown as Record<string, unknown>);
  },

  async getAll(
    page = 1,
    pageSize = 10,
    status?: string
  ): Promise<{
    items: ScheduledEmail[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const where = status ? { status } : {};

    const [records, total] = await Promise.all([
      prisma.scheduledEmail.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.scheduledEmail.count({ where }),
    ]);

    return {
      items: records.map((r) => formatEmail(r as unknown as Record<string, unknown>)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  async getById(id: string): Promise<ScheduledEmail | null> {
    const record = await prisma.scheduledEmail.findUnique({
      where: { id },
      include: { logs: { orderBy: { createdAt: "desc" } } },
    });

    if (!record) return null;

    return {
      ...formatEmail(record as unknown as Record<string, unknown>),
      logs: (record as Record<string, unknown>).logs as Array<{
        id: string;
        scheduledEmailId: string;
        status: string;
        message: string | null;
        createdAt: string;
      }>,
    } as ScheduledEmail & { logs: Array<{ id: string; scheduledEmailId: string; status: string; message: string | null; createdAt: string }> };
  },

  async update(
    id: string,
    data: UpdateScheduledEmailInput
  ): Promise<ScheduledEmail | null> {
    const existing = await prisma.scheduledEmail.findUnique({ where: { id } });
    if (!existing) return null;

    if (existing.status !== "pending") {
      throw new Error("Can only edit pending emails");
    }

    const updateData: Record<string, unknown> = {};
    if (data.recipient) updateData.recipient = data.recipient;
    if (data.subject) updateData.subject = data.subject;
    if (data.message) updateData.message = data.message;
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);

    const record = await prisma.scheduledEmail.update({
      where: { id },
      data: updateData,
    });

    return formatEmail(record as unknown as Record<string, unknown>);
  },

  async cancel(id: string): Promise<ScheduledEmail | null> {
    const existing = await prisma.scheduledEmail.findUnique({ where: { id } });
    if (!existing) return null;

    if (existing.status !== "pending") {
      throw new Error("Can only cancel pending emails");
    }

    const record = await prisma.scheduledEmail.update({
      where: { id },
      data: { status: "cancelled", failureReason: "Cancelled by user" },
    });

    await prisma.emailLog.create({
      data: {
        scheduledEmailId: id,
        status: "cancelled",
        message: "Cancelled by user",
      },
    });

    return formatEmail(record as unknown as Record<string, unknown>);
  },

  async delete(id: string): Promise<boolean> {
    const existing = await prisma.scheduledEmail.findUnique({ where: { id } });
    if (!existing) return false;

    await prisma.scheduledEmail.delete({ where: { id } });
    return true;
  },

  async updateJobId(id: string, jobId: string): Promise<void> {
    await prisma.scheduledEmail.update({
      where: { id },
      data: { jobId },
    });
  },

  async markProcessing(id: string): Promise<void> {
    await prisma.scheduledEmail.update({
      where: { id },
      data: { status: "processing" },
    });
    await prisma.emailLog.create({
      data: {
        scheduledEmailId: id,
        status: "processing",
        message: "Processing email",
      },
    });
  },

  async markSent(id: string): Promise<void> {
    await prisma.scheduledEmail.update({
      where: { id },
      data: { status: "sent", sentAt: new Date() },
    });
    await prisma.emailLog.create({
      data: {
        scheduledEmailId: id,
        status: "sent",
        message: "Email sent successfully",
      },
    });
  },

  async markFailed(id: string, reason: string): Promise<void> {
    await prisma.scheduledEmail.update({
      where: { id },
      data: {
        status: "failed",
        failureReason: reason,
        retryCount: { increment: 1 },
      },
    });
    await prisma.emailLog.create({
      data: {
        scheduledEmailId: id,
        status: "failed",
        message: reason,
      },
    });
  },

  async getStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    failed: number;
    processing: number;
    cancelled: number;
  }> {
    const [total, pending, sent, failed, processing, cancelled] = await Promise.all([
      prisma.scheduledEmail.count(),
      prisma.scheduledEmail.count({ where: { status: "pending" } }),
      prisma.scheduledEmail.count({ where: { status: "sent" } }),
      prisma.scheduledEmail.count({ where: { status: "failed" } }),
      prisma.scheduledEmail.count({ where: { status: "processing" } }),
      prisma.scheduledEmail.count({ where: { status: "cancelled" } }),
    ]);

    return { total, pending, sent, failed, processing, cancelled };
  },
};
