import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { emailApi } from "../services/emailApi";
import { useApi } from "../hooks/useApi";
import { LoadingPage } from "../components/Loading";
import { ErrorState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { toastSuccess, toastError } from "../components/Toast";
import type { ScheduledEmail, EmailLogEntry } from "../types";

export function EmailDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data: email,
    loading,
    error,
    refetch,
  } = useApi(() => emailApi.getById(id!), [id]);

  const [cancelTarget, setCancelTarget] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (loading) return <LoadingPage message="Loading email details..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!email) return <ErrorState message="Email not found" />;

  const logs = (email as ScheduledEmail & { logs?: EmailLogEntry[] }).logs || [];

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await emailApi.cancel(email.id);
      toastSuccess("Email cancelled");
      refetch();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setActionLoading(false);
      setCancelTarget(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await emailApi.delete(email.id);
      toastSuccess("Email deleted");
      navigate("/");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionLoading(false);
      setDeleteTarget(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/"
            className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {email.subject}
          </h1>
        </div>
        <StatusBadge status={email.status} />
      </div>

      <div className="card p-6">
        <div className="space-y-4">
          <DetailRow label="Recipient" value={email.recipient} />
          <DetailRow label="Subject" value={email.subject} />
          <DetailRow label="Scheduled For" value={formatDateTime(email.scheduledAt)} />
          {email.sentAt && (
            <DetailRow label="Sent At" value={formatDateTime(email.sentAt)} />
          )}
          {email.failureReason && (
            <DetailRow
              label="Failure Reason"
              value={email.failureReason}
              valueClassName="text-danger-500"
            />
          )}
          <DetailRow label="Retry Count" value={String(email.retryCount)} />
          <DetailRow label="Created" value={formatDateTime(email.createdAt)} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Message</h3>
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {email.message}
          </p>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Activity Log
          </h3>
          <div className="space-y-3">
            {logs.map((log) => {
              const previewMatch = log.message?.match(/Preview:\s*(https?:\/\/\S+)/);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-100 px-4 py-3"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                      log.status === "sent"
                        ? "bg-emerald-500"
                        : log.status === "failed"
                          ? "bg-red-500"
                          : log.status === "cancelled"
                            ? "bg-gray-400"
                            : log.status === "processing"
                              ? "bg-blue-500"
                              : "bg-amber-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium capitalize text-gray-700">
                        {log.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    {log.message && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {previewMatch ? log.message.replace(/Preview:\s*\S+/, "").trim() || "Email sent" : log.message}
                      </p>
                    )}
                    {previewMatch && (
                      <a
                        href={previewMatch[1]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View sent email preview
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-gray-100 pt-6">
        {email.status === "pending" && (
          <button onClick={() => setCancelTarget(true)} className="btn-secondary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel Email
          </button>
        )}
        <button onClick={() => setDeleteTarget(true)} className="btn-danger">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>

      <ConfirmDialog
        isOpen={cancelTarget}
        title="Cancel Email"
        message="Are you sure you want to cancel this scheduled email? It will not be sent."
        confirmLabel="Cancel Email"
        variant="danger"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(false)}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={deleteTarget}
        title="Delete Email"
        message="Are you sure you want to permanently delete this email? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(false)}
        loading={actionLoading}
      />
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-32 flex-shrink-0 text-xs font-medium text-gray-500">
        {label}
      </span>
      <span className={`text-sm text-gray-900 ${valueClassName}`}>{value}</span>
    </div>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
