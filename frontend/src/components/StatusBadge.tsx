import type { EmailStatus } from "../types";

interface BadgeProps {
  status: EmailStatus;
}

const statusConfig: Record<EmailStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "badge-pending",
  },
  processing: {
    label: "Processing",
    className: "badge-processing",
  },
  sent: {
    label: "Sent",
    className: "badge-sent",
  },
  failed: {
    label: "Failed",
    className: "badge-failed",
  },
  cancelled: {
    label: "Cancelled",
    className: "badge-cancelled",
  },
};

export function StatusBadge({ status }: BadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={config.className}>
      {status === "processing" && (
        <svg className="mr-1 inline h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {config.label}
    </span>
  );
}
