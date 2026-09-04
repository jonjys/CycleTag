"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";

export type ToastTone = "success" | "error";

export function ActionToast({
  message,
  tone = "success"
}: {
  message: string;
  tone?: ToastTone;
}) {
  const Icon = tone === "error" ? CircleAlert : CheckCircle2;

  return (
    <div
      className={`toast${tone === "error" ? " toast-error" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon aria-hidden="true" size={16} strokeWidth={2.4} />
      <p>{message}</p>
    </div>
  );
}
