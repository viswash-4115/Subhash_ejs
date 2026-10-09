import { z } from "zod";

export const createScheduledEmailSchema = z.object({
  recipient: z
    .string()
    .min(1, "Recipient is required")
    .email("Please enter a valid email address"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be under 200 characters"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(5000, "Message must be under 5000 characters"),
  scheduledAt: z
    .string()
    .min(1, "Scheduled date/time is required")
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Please enter a valid date/time")
    .refine((val) => {
      const date = new Date(val);
      return date.getTime() > Date.now();
    }, "Scheduled time must be in the future"),
});

export const updateScheduledEmailSchema = z.object({
  recipient: z
    .string()
    .email("Please enter a valid email address")
    .optional(),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be under 200 characters")
    .optional(),
  message: z
    .string()
    .min(1, "Message is required")
    .max(5000, "Message must be under 5000 characters")
    .optional(),
  scheduledAt: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Please enter a valid date/time")
    .refine((val) => {
      const date = new Date(val);
      return date.getTime() > Date.now();
    }, "Scheduled time must be in the future")
    .optional(),
});

export type CreateScheduledEmailInput = z.infer<typeof createScheduledEmailSchema>;
export type UpdateScheduledEmailInput = z.infer<typeof updateScheduledEmailSchema>;

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  message: string;
  scheduledAt: string;
  status: string;
  jobId?: string | null;
  sentAt?: string | null;
  failureReason?: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}
