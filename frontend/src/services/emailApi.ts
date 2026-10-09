const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; message?: string }> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "An unexpected error occurred");
  }

  return { data: body.data, message: body.message };
}

import type {
  ScheduledEmail,
  PaginatedResponse,
  CreateScheduledEmailPayload,
  Stats,
} from "../types";

export const emailApi = {
  async getAll(
    page = 1,
    pageSize = 10,
    status?: string
  ): Promise<PaginatedResponse<ScheduledEmail>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set("status", status);
    const { data } = await request<PaginatedResponse<ScheduledEmail>>(
      `/emails?${params}`
    );
    return data;
  },

  async getById(id: string): Promise<ScheduledEmail> {
    const { data } = await request<ScheduledEmail>(`/emails/${id}`);
    return data;
  },

  async create(
    payload: CreateScheduledEmailPayload
  ): Promise<ScheduledEmail> {
    const { data, message } = await request<ScheduledEmail>("/emails", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (message) console.log(message);
    return data;
  },

  async cancel(id: string): Promise<ScheduledEmail> {
    const { data } = await request<ScheduledEmail>(`/emails/${id}/cancel`, {
      method: "PATCH",
    });
    return data;
  },

  async delete(id: string): Promise<void> {
    await request(`/emails/${id}`, { method: "DELETE" });
  },

  async getStats(): Promise<Stats> {
    const { data } = await request<Stats>("/emails/stats");
    return data;
  },
};
