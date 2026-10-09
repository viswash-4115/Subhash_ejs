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
  logs?: EmailLogEntry[];
}

export interface CreateScheduledEmailPayload {
  recipient: string;
  subject: string;
  message: string;
  scheduledAt: string;
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
  status: string;
  message?: string | null;
  createdAt: string;
}

export interface Stats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  processing: number;
  cancelled: number;
}
