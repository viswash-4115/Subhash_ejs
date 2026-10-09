import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { emailApi } from "../services/emailApi";
import { useApi } from "../hooks/useApi";
import { StatusBadge } from "../components/StatusBadge";
import { TableSkeleton } from "../components/Loading";
import { EmptyState, ErrorState } from "../components/EmptyState";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { toastSuccess, toastError } from "../components/Toast";
import type { ScheduledEmail, Stats } from "../types";

export function DashboardPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: stats } = useApi(() => emailApi.getStats(), []);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailApi.getAll(page, 8, statusFilter || undefined);
      setEmails(result.items);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleRefresh = () => fetchEmails();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your scheduled emails
          </p>
        </div>
        <Link to="/schedule" className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Schedule Email
        </Link>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Scheduled Emails
            <span className="ml-2 text-xs font-normal text-gray-400">
              ({total})
            </span>
          </h2>
          <div className="flex items-center gap-3">
            <StatusFilter
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            />
            <button
              onClick={handleRefresh}
              className="btn-ghost"
              aria-label="Refresh"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={handleRefresh} />
          ) : emails.length === 0 ? (
            <EmptyState
              title="No scheduled emails"
              description={
                statusFilter
                  ? "No emails match the current filter."
                  : "Get started by scheduling your first email."
              }
              action={
                !statusFilter ? (
                  <Link to="/schedule" className="btn-primary">
                    Schedule your first email
                  </Link>
                ) : (
                  <button
                    onClick={() => setStatusFilter("")}
                    className="btn-secondary"
                  >
                    Clear filter
                  </button>
                )
              }
            />
          ) : (
            <>
              <EmailTable emails={emails} onRefresh={handleRefresh} />
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsCards({ stats }: { stats: Stats }) {
  const items = [
    { label: "Total", value: stats.total, color: "text-gray-900" },
    { label: "Pending", value: stats.pending, color: "text-amber-600" },
    { label: "Processing", value: stats.processing, color: "text-blue-600" },
    { label: "Sent", value: stats.sent, color: "text-emerald-600" },
    { label: "Failed", value: stats.failed, color: "text-red-600" },
    { label: "Cancelled", value: stats.cancelled, color: "text-gray-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="card px-4 py-3">
          <p className="text-xs font-medium text-gray-500">{item.label}</p>
          <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function StatusFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field w-auto text-xs"
      aria-label="Filter by status"
    >
      <option value="">All statuses</option>
      <option value="pending">Pending</option>
      <option value="processing">Processing</option>
      <option value="sent">Sent</option>
      <option value="failed">Failed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  );
}

function EmailTable({
  emails,
  onRefresh,
}: {
  emails: ScheduledEmail[];
  onRefresh: () => void;
}) {
  const [deleteTarget, setDeleteTarget] = useState<ScheduledEmail | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ScheduledEmail | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await emailApi.delete(deleteTarget.id);
      toastSuccess("Email deleted");
      onRefresh();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setLoading(true);
    try {
      await emailApi.cancel(cancelTarget.id);
      toastSuccess("Email cancelled");
      onRefresh();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setLoading(false);
      setCancelTarget(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="pb-3 pr-4">Recipient</th>
              <th className="pb-3 pr-4">Subject</th>
              <th className="hidden pb-3 pr-4 sm:table-cell">Scheduled</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {emails.map((email) => (
              <tr
                key={email.id}
                className="group transition-colors hover:bg-gray-50/50"
              >
                <td className="py-3.5 pr-4">
                  <span className="font-medium text-gray-900">
                    {email.recipient}
                  </span>
                </td>
                <td className="max-w-[200px] truncate py-3.5 pr-4 text-gray-600">
                  {email.subject}
                </td>
                <td className="hidden whitespace-nowrap py-3.5 pr-4 text-gray-500 sm:table-cell">
                  {formatDateTime(email.scheduledAt)}
                </td>
                <td className="py-3.5 pr-4">
                  <StatusBadge status={email.status} />
                </td>
                <td className="py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      to={`/email/${email.id}`}
                      className="btn-ghost text-xs"
                    >
                      View
                    </Link>
                    {email.status === "pending" && (
                      <>
                        <button
                          onClick={() => setCancelTarget(email)}
                          className="btn-ghost text-xs text-amber-600 hover:text-amber-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setDeleteTarget(email)}
                      className="btn-ghost text-xs text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Email"
        message={`Cancel the scheduled email to ${cancelTarget?.recipient}?`}
        confirmLabel="Cancel Email"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        loading={loading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Email"
        message={`Permanently delete the email to ${deleteTarget?.recipient}?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={loading}
      />
    </>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost text-xs"
      >
        Previous
      </button>
      <span className="text-xs text-gray-500">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost text-xs"
      >
        Next
      </button>
    </div>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
