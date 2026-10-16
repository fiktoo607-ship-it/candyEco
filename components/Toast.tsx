"use client";

import { useEffect, useRef, useState } from "react";

export interface ToastProps {
  message: string | null;
  type?: "error" | "success" | "info";
  onClose: () => void;
  duration?: number;
  role?: "status" | "alert";
  "aria-live"?: "polite" | "assertive";
}

export default function Toast({
  message,
  type = "error",
  onClose,
  duration,
  role: roleProp,
  "aria-live": ariaLiveProp,
}: ToastProps) {
  // Errors default to 10s (or 0 for manual dismiss), info/success default to 4.5s
  const effectiveDuration =
    duration !== undefined
      ? duration
      : type === "error"
      ? 10000
      : 4500;

  const [isPaused, setIsPaused] = useState(false);
  const remainingTimeRef = useRef(effectiveDuration);
  const startTimeRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    remainingTimeRef.current = effectiveDuration;
    setIsPaused(false);
    startTimeRef.current = null;
  }, [message, effectiveDuration]);

  // Pause on hover and focus via native DOM listeners for maximum accessibility compatibility
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onEnter = () => {
      if (effectiveDuration > 0) setIsPaused(true);
    };
    const onLeave = () => {
      if (effectiveDuration > 0) setIsPaused(false);
    };
    const onFocusIn = () => {
      if (effectiveDuration > 0) setIsPaused(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (effectiveDuration > 0 && !el.contains(e.relatedTarget as Node)) {
        setIsPaused(false);
      }
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    el.addEventListener("focus", onFocusIn, true);
    el.addEventListener("blur", onFocusOut, true);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      el.removeEventListener("focus", onFocusIn, true);
      el.removeEventListener("blur", onFocusOut, true);
    };
  }, [effectiveDuration]);

  useEffect(() => {
    if (!message || effectiveDuration <= 0 || isPaused) return;

    startTimeRef.current = Date.now();
    const timer = setTimeout(() => {
      onClose();
    }, remainingTimeRef.current);

    return () => {
      clearTimeout(timer);
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        startTimeRef.current = null;
      }
    };
  }, [message, effectiveDuration, isPaused, onClose]);

  const computedRole = roleProp ?? (type === "error" ? "alert" : "status");
  const computedAriaLive =
    ariaLiveProp ?? (computedRole === "alert" || type === "error" ? "assertive" : "polite");

  const bgStyles =
    type === "success"
      ? "bg-emerald-600/95 border-emerald-400/40 text-white shadow-emerald-950/30"
      : type === "info"
      ? "bg-blue-600/95 border-blue-400/40 text-white shadow-blue-950/30"
      : "bg-rose-600/95 border-rose-400/40 text-white shadow-rose-950/30";

  return (
    <div
      ref={containerRef}
      className={`fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-[9999] transition-all duration-300 ${
        message ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
      onMouseEnter={() => effectiveDuration > 0 && setIsPaused(true)}
      onMouseLeave={() => effectiveDuration > 0 && setIsPaused(false)}
      onFocus={() => effectiveDuration > 0 && setIsPaused(true)}
      onBlur={(e) => {
        if (effectiveDuration > 0 && !e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsPaused(false);
        }
      }}
    >
      <div
        role={computedRole}
        aria-live={computedAriaLive}
        aria-atomic="true"
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 shadow-xl backdrop-blur-md transition-all ${
          message ? bgStyles : "hidden"
        }`}
      >
        {message && (
          <>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <span
                className="material-symbols-outlined text-xl select-none text-white"
                aria-hidden="true"
                translate="no"
              >
                {type === "success" ? "check_circle" : type === "info" ? "info" : "error"}
              </span>
            </div>
            <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              aria-label="Fermer la notification"
            >
              <span
                className="material-symbols-outlined text-lg select-none"
                aria-hidden="true"
                translate="no"
              >
                close
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
