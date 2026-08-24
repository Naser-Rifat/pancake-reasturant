"use client";

// Hand-rolled shadcn-style toast system — no dependencies.
// Wrap the admin shell in <ToastProvider>; fire with:
//   const { toast } = useToast();
//   toast({ variant: "success", title: "Menu saved" });
//   toast({ variant: "error", title: "Save failed", description: msg });
//   toast({ variant: "success", title: "Theme applied", action: { label: "View site", href: "/" } });

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type Variant = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: Variant;
  /** Optional link rendered inside the toast, e.g. “View site”. */
  action?: { label: string; href: string };
}

interface ToastItem extends ToastInput {
  id: number;
  leaving?: boolean;
}

const ToastCtx = createContext<{ toast: (t: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICON: Record<Variant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const ACCENT: Record<Variant, string> = {
  success: "text-emerald-600",
  error: "text-destructive",
  info: "text-sky-600",
};

const LIFETIME: Record<Variant, number> = { success: 3200, info: 3200, error: 5200 };
const EXIT_MS = 180;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    // two-phase: mark as leaving so the exit animation plays, then drop it
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++idRef.current;
      const variant = input.variant ?? "info";
      setToasts((ts) => [...ts.slice(-3), { ...input, variant, id }]);
      setTimeout(() => dismiss(id), LIFETIME[variant]);
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => {
          const Icon = ICON[t.variant ?? "info"];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border bg-white p-3 pr-2 shadow-lg ${
                t.leaving ? "toast-out" : "toast-in"
              }`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ACCENT[t.variant ?? "info"]}`} />
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-semibold leading-snug">{t.title}</div>
                {t.description && (
                  <div className="mt-0.5 leading-snug text-muted-foreground">{t.description}</div>
                )}
                {t.action && (
                  <a
                    href={t.action.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-block text-xs font-semibold underline underline-offset-2 hover:no-underline"
                  >
                    {t.action.label} ↗
                  </a>
                )}
              </div>
              <button
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
