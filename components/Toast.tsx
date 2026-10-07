"use client";

import { useEffect } from "react";

export interface ToastProps {
  message: string | null;
  type?: "error" | "success" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = "error",
  onClose,
  duration = 4500,
}: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgStyles =
    type === "success"
      ? "bg-emerald-600/95 border-emerald-400/40 text-white shadow-emerald-950/30"
      : type === "info"
      ? "bg-blue-600/95 border-blue-400/40 text-white shadow-blue-950/30"
      : "bg-rose-600/95 border-rose-400/40 text-white shadow-rose-950/30";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-[9999] pointer-events-auto">
      <div
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-xl backdrop-blur-md transition-all ${bgStyles}`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <span className="material-symbols-outlined text-xl select-none text-white">
            {type === "success" ? "check_circle" : type === "info" ? "info" : "error"}
          </span>
        </div>
        <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          aria-label="Fermer"
        >
          <span className="material-symbols-outlined text-lg select-none" aria-hidden="true">close</span>
        </button>
      </div>
    </div>
  );
}
