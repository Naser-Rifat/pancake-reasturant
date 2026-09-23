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

const ACCENT_STYLES: Record<Variant, { iconBox: string }> = {
  success: {
    iconBox: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30",
  },
  error: {
    iconBox: "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30",
  },
  info: {
    iconBox: "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30",
  },
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
      {/* 
        Responsive Toast Viewport:
        - Mobile: Floating pill at the top-center (Dynamic Island / iOS banner style),
                  padded with inset-x-3 so it is never clipped against screen edges.
        - Tablet & Desktop: Floating in the bottom-right corner.
      */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed z-[100] flex flex-col gap-2.5 inset-x-3 top-3 max-w-[420px] mx-auto sm:inset-x-auto sm:top-auto sm:bottom-6 sm:right-6 sm:mx-0 sm:max-w-sm w-auto"
      >
        {toasts.map((t) => {
          const variant = t.variant ?? "info";
          const Icon = ICON[variant];
          const style = ACCENT_STYLES[variant];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl p-3.5 sm:p-4 shadow-2xl transition-all duration-200 bg-[#1c1917]/95 backdrop-blur-xl border border-white/15 text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] ${
                t.leaving ? "toast-out" : "toast-in"
              }`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full mt-0.5 ${style.iconBox}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 text-sm pt-0.5">
                <div className="font-bold text-white leading-snug tracking-tight text-[13px] sm:text-sm">
                  {t.title}
                </div>
                {t.description && (
                  <div className="mt-0.5 text-xs text-zinc-300 leading-relaxed font-normal">
                    {t.description}
                  </div>
                )}
                {t.action && (
                  <a
                    href={t.action.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 hover:no-underline"
                  >
                    <span>{t.action.label}</span>
                    <span>↗</span>
                  </a>
                )}
              </div>
              <button
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
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
