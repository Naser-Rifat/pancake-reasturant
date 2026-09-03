"use client";

// Promise-based replacement for window.confirm / window.prompt across the
// admin panel. One provider, one styled modal:
//
//   const { confirm, promptText } = useConfirm();
//   if (!(await confirm({ title: "Delete this?", destructive: true }))) return;
//   const reason = await promptText({ title: "Cancel order?", label: "Reason" });
//   if (reason === null) return; // dismissed
//
// Escape and the backdrop dismiss; Enter confirms; focus lands on the right
// control for each mode.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface PromptOptions extends ConfirmOptions {
  label?: string;
  placeholder?: string;
  initial?: string;
}

interface Ctx {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  promptText: (opts: PromptOptions) => Promise<string | null>;
}

const ConfirmContext = createContext<Ctx | null>(null);

type Pending =
  | { mode: "confirm"; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { mode: "prompt"; opts: PromptOptions; resolve: (v: string | null) => void };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [text, setText] = useState("");
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setPending({ mode: "confirm", opts, resolve })),
    [],
  );
  const promptText = useCallback(
    (opts: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        setText(opts.initial ?? "");
        setPending({ mode: "prompt", opts, resolve });
      }),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      if (!pending) return;
      if (pending.mode === "confirm") pending.resolve(ok);
      else pending.resolve(ok ? text.trim() : null);
      setPending(null);
    },
    [pending, text],
  );

  useEffect(() => {
    if (!pending) return;
    // focus the natural first control for the mode
    const id = requestAnimationFrame(() =>
      (pending.mode === "prompt" ? textRef.current : confirmBtnRef.current)?.focus(),
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("keydown", onKey);
    };
  }, [pending, close]);

  const opts = pending?.opts;

  return (
    <ConfirmContext.Provider value={{ confirm, promptText }}>
      {children}
      {pending && opts && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-xl border bg-background p-6 shadow-2xl duration-150 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  opts.destructive ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"
                }`}
              >
                {opts.destructive ? <AlertTriangle className="h-4.5 w-4.5" /> : <HelpCircle className="h-4.5 w-4.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="confirm-title" className="text-base font-semibold leading-6">
                  {opts.title}
                </h2>
                {opts.description && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{opts.description}</p>
                )}
                {pending.mode === "prompt" && (
                  <div className="mt-3">
                    {"label" in opts && opts.label && (
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{opts.label}</p>
                    )}
                    <Textarea
                      ref={textRef}
                      rows={3}
                      value={text}
                      placeholder={"placeholder" in opts ? opts.placeholder : undefined}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => close(false)}>
                {opts.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                ref={confirmBtnRef}
                variant={opts.destructive ? "destructive" : "default"}
                size="sm"
                onClick={() => close(true)}
              >
                {opts.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Ctx {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
