// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Toast from "@/components/Toast";
// @ts-expect-error next.config.mjs has no declaration file
import nextConfig from "@/next.config.mjs";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function renderComponent(ui: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(ui);
  });
  return {
    container,
    rerender: (newUi: React.ReactNode) => {
      act(() => {
        root.render(newUi);
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("A11y & DevOps Audit: Toast Accessibility & Cache Headers (Issue #125, #108)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  describe("Toast Live Region & Semantic Structure", () => {
    it("mounts a persistent live region container in the DOM even when message is null", () => {
      const { container, unmount } = renderComponent(
        <Toast message={null} type="success" onClose={vi.fn()} />
      );

      const liveRegion = container.querySelector('[role="status"]');
      expect(liveRegion).not.toBeNull();
      expect(liveRegion?.getAttribute("aria-live")).toBe("polite");
      expect(liveRegion?.getAttribute("aria-atomic")).toBe("true");

      unmount();
    });

    it("renders role='alert' and aria-live='assertive' for error toasts", () => {
      const { container, unmount } = renderComponent(
        <Toast message="Identifiants invalides." type="error" onClose={vi.fn()} />
      );

      const alertRegion = container.querySelector('[role="alert"]');
      expect(alertRegion).not.toBeNull();
      expect(alertRegion?.getAttribute("aria-live")).toBe("assertive");
      expect(alertRegion?.textContent).toContain("Identifiants invalides.");

      unmount();
    });

    it("renders role='status' and aria-live='polite' for success toasts", () => {
      const { container, unmount } = renderComponent(
        <Toast message="Connexion réussie." type="success" onClose={vi.fn()} />
      );

      const statusRegion = container.querySelector('[role="status"]');
      expect(statusRegion).not.toBeNull();
      expect(statusRegion?.getAttribute("aria-live")).toBe("polite");
      expect(statusRegion?.textContent).toContain("Connexion réussie.");

      unmount();
    });

    it("ensures all Material symbols inside toast have aria-hidden='true'", () => {
      const { container, unmount } = renderComponent(
        <Toast message="Opération validée." type="success" onClose={vi.fn()} />
      );

      const icons = container.querySelectorAll(".material-symbols-outlined");
      expect(icons.length).toBeGreaterThan(0);
      icons.forEach((icon) => {
        expect(icon.getAttribute("aria-hidden")).toBe("true");
      });

      unmount();
    });

    it("provides an accessible close button with a meaningful aria-label", () => {
      const onClose = vi.fn();
      const { container, unmount } = renderComponent(
        <Toast message="Info message." type="info" onClose={onClose} />
      );

      const closeButton = container.querySelector("button");
      expect(closeButton).not.toBeNull();
      expect(closeButton?.getAttribute("aria-label")).toBe("Fermer la notification");

      act(() => {
        closeButton?.click();
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe("Toast Timing & WCAG 2.2.1 Pause on Hover/Focus", () => {
    it("auto-dismisses after the specified duration", () => {
      const onClose = vi.fn();
      const { unmount } = renderComponent(
        <Toast message="Message temporaire" type="info" duration={3000} onClose={onClose} />
      );

      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("pauses auto-dismiss countdown on mouse hover and resumes on mouse leave", () => {
      const onClose = vi.fn();
      const { container, unmount } = renderComponent(
        <Toast message="Lecture en cours" type="info" duration={4000} onClose={onClose} />
      );

      const toastContainer = container.firstElementChild as HTMLElement;

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(onClose).not.toHaveBeenCalled();

      // Mouse enter -> pause
      act(() => {
        toastContainer.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
      });

      // Advance well past original duration
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(onClose).not.toHaveBeenCalled();

      // Mouse leave -> resume remaining time
      act(() => {
        toastContainer.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      });

      act(() => {
        vi.advanceTimersByTime(1999);
      });
      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("pauses countdown when keyboard focus enters toast and resumes on blur", () => {
      const onClose = vi.fn();
      const { container, unmount } = renderComponent(
        <Toast message="Action requise" type="info" duration={4000} onClose={onClose} />
      );

      const toastContainer = container.firstElementChild as HTMLElement;

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Focus
      act(() => {
        toastContainer.dispatchEvent(new FocusEvent("focus", { bubbles: true }));
      });

      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(onClose).not.toHaveBeenCalled();

      // Blur
      act(() => {
        toastContainer.dispatchEvent(
          new FocusEvent("blur", { bubbles: true, relatedTarget: document.body })
        );
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("defaults error toasts to 10000ms duration for accessibility", () => {
      const onClose = vi.fn();
      const { unmount } = renderComponent(
        <Toast message="Erreur critique" type="error" onClose={onClose} />
      );

      act(() => {
        vi.advanceTimersByTime(4500);
      });
      // Should NOT dismiss at old 4500ms
      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(5500);
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      unmount();
    });
  });

  describe("Next.js Static Asset & Image Cache Headers", () => {
    it("preserves immutable Cache-Control for /images/:path* and /_next/static/:path*", async () => {
      const headers = await nextConfig.headers();

      const imageHeader = headers.find((h: any) => h.source === "/images/:path*");
      expect(imageHeader).toBeDefined();
      expect(imageHeader.headers[0].value).toBe("public, max-age=31536000, immutable");

      const staticNextHeader = headers.find((h: any) => h.source === "/_next/static/:path*");
      expect(staticNextHeader).toBeDefined();
      expect(staticNextHeader.headers[0].value).toBe("public, max-age=31536000, immutable");
    });
  });
});
