import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { emailApi } from "../services/emailApi";
import { toastSuccess, toastError } from "../components/Toast";

interface FormErrors {
  recipient?: string;
  subject?: string;
  message?: string;
  scheduledAt?: string;
}

export function ScheduleEmailPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    recipient: "",
    subject: "",
    message: "",
    scheduledAt: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: FormErrors = {};

    if (!form.recipient.trim()) {
      errs.recipient = "Recipient is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipient)) {
      errs.recipient = "Please enter a valid email address";
    }

    if (!form.subject.trim()) {
      errs.subject = "Subject is required";
    } else if (form.subject.length > 200) {
      errs.subject = "Subject must be under 200 characters";
    }

    if (!form.message.trim()) {
      errs.message = "Message is required";
    } else if (form.message.length > 5000) {
      errs.message = "Message must be under 5000 characters";
    }

    if (!form.scheduledAt) {
      errs.scheduledAt = "Scheduled date/time is required";
    } else {
      const date = new Date(form.scheduledAt);
      if (isNaN(date.getTime())) {
        errs.scheduledAt = "Please enter a valid date/time";
      } else if (date.getTime() <= Date.now()) {
        errs.scheduledAt = "Scheduled time must be in the future";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await emailApi.create({
        recipient: form.recipient.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      toastSuccess("Email scheduled successfully");
      navigate("/");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to schedule email");
    } finally {
      setLoading(false);
    }
  }

  const minDateTime = (() => {
    const d = new Date(Date.now() + 60000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Schedule Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new scheduled email to be sent at a later time.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8" noValidate>
        <div className="space-y-5">
          <FormField
            label="Recipient"
            error={errors.recipient}
            required
          >
            <input
              type="email"
              name="recipient"
              value={form.recipient}
              onChange={handleChange}
              placeholder="recipient@example.com"
              className="input-field"
              aria-invalid={!!errors.recipient}
              aria-describedby={errors.recipient ? "recipient-error" : undefined}
            />
          </FormField>

          <FormField
            label="Subject"
            error={errors.subject}
            required
          >
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="What is this email about?"
              className="input-field"
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? "subject-error" : undefined}
            />
          </FormField>

          <FormField
            label="Message"
            error={errors.message}
            required
          >
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={6}
              placeholder="Write your email content here..."
              className="input-field resize-none"
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            <p className="mt-1 text-xs text-gray-400">
              {form.message.length}/5000 characters
            </p>
          </FormField>

          <FormField
            label="Scheduled Date & Time"
            error={errors.scheduledAt}
            required
          >
            <input
              type="datetime-local"
              name="scheduledAt"
              value={form.scheduledAt}
              onChange={handleChange}
              min={minDateTime}
              className="input-field"
              aria-invalid={!!errors.scheduledAt}
              aria-describedby={errors.scheduledAt ? "scheduledAt-error" : undefined}
            />
          </FormField>
        </div>

        <div className="mt-8 flex items-center gap-3 border-t border-gray-100 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scheduling...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Schedule Email
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="ml-0.5 text-danger-500">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${label.toLowerCase().replace(/\s+/g, "")}-error`} className="mt-1.5 text-xs text-danger-500">
          {error}
        </p>
      )}
    </div>
  );
}
