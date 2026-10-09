export type EmailStatus = "pending" | "processing" | "sent" | "failed" | "cancelled";

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  message: string;
  scheduledAt: string;
  status: EmailStatus;
  jobId?: string | null;
  sentAt?: string | null;
  failureReason?: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledEmailPayload {
  recipient: string;
  subject: string;
  message: string;
  scheduledAt: string;
}

export interface UpdateScheduledEmailPayload {
  recipient?: string;
  subject?: string;
  message?: string;
  scheduledAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EmailLogEntry {
  id: string;
  scheduledEmailId: string;
  status: EmailStatus;
  message?: string | null;
  createdAt: string;
}
