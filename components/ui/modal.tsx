"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Modal Context & Types
// ============================================================================

interface ModalContextValue {
  onClose: () => void;
  titleId: string;
  variant: "adaptive" | "dialog";
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("Modal compound components must be rendered inside <Modal>.");
  }
  return ctx;
}

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /**
   * "adaptive": 100% full-screen sheet on mobile (<640px) to prevent background
   *             content leaks; centered floating card on tablet & desktop.
   * "dialog":   Centered dialog on all screen sizes.
   * Defaults to "adaptive".
   */
  variant?: "adaptive" | "dialog";
  /** Maximum width on tablet/desktop. Defaults to "2xl". */
  size?: ModalSize;
  /** Dismiss when clicking the dark backdrop outside the dialog card. Defaults to true. */
  closeOnBackdropClick?: boolean;
  /** Dismiss when pressing the Escape key. Defaults to true. */
  closeOnEscape?: boolean;
  /** Custom container class */
  className?: string;
  /** Custom inner dialog card class */
  contentClassName?: string;
  /** Ref attached to the inner dialog card */
  containerRef?: RefObject<HTMLDivElement | null>;
  /** Optional accessible label if no ModalHeader title is present */
  ariaLabel?: string;
}

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl lg:max-w-3xl",
  "3xl": "sm:max-w-3xl lg:max-w-4xl",
  "4xl": "sm:max-w-4xl lg:max-w-5xl",
  "5xl": "sm:max-w-5xl lg:max-w-6xl",
  full: "sm:max-w-6xl",
};

// ============================================================================
// Root Modal Component
// ============================================================================

export function Modal({
  open,
  onClose,
  children,
  variant = "adaptive",
  size = "2xl",
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  contentClassName,
  containerRef,
  ariaLabel,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const innerRef = useRef<HTMLDivElement>(null);
  const resolvedRef = containerRef ?? innerRef;

  // 1. SSR hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. Lock body scroll while modal is active
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // 3. Escape key dismiss
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEscape, onClose]);

  if (!mounted || !open) return null;

  const isAdaptive = variant === "adaptive";

  const modalNode = (
    <ModalContext.Provider value={{ onClose, titleId, variant }}>
      <div
        className={cn(
          "fixed inset-0 z-50 flex overflow-hidden h-[100dvh] max-h-[100dvh]",
          isAdaptive
            ? "flex-col bg-white sm:bg-black/60 sm:backdrop-blur-xs sm:justify-center sm:items-center p-0 sm:p-4 md:p-6"
            : "items-center justify-center p-4 bg-black/60 backdrop-blur-xs",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
      >
        {/* Backdrop overlay for outside click dismiss */}
        {closeOnBackdropClick && (
          <div
            className={cn(
              "fixed inset-0 -z-10 cursor-pointer",
              isAdaptive ? "hidden sm:block" : "block"
            )}
            onClick={onClose}
            aria-hidden="true"
          />
        )}

        {/* Modal Window Container */}
        <div
          ref={resolvedRef}
          className={cn(
            "relative w-full flex flex-col bg-white overflow-hidden",
            isAdaptive
              ? cn(
                  "h-[100dvh] max-h-[100dvh] rounded-none border-0 shadow-none",
                  "sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-zinc-200 sm:shadow-2xl",
                  SIZE_CLASSES[size]
                )
              : cn(
                  "max-h-[90vh] rounded-2xl border border-zinc-200 shadow-2xl",
                  SIZE_CLASSES[size]
                ),
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );

  return createPortal(modalNode, document.body);
}

// ============================================================================
// ModalHeader Component
// ============================================================================

export interface ModalHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  sticky?: boolean;
}

export function ModalHeader({
  title,
  description,
  action,
  showCloseButton = true,
  onClose: customClose,
  sticky = true,
  className,
  children,
  ...props
}: ModalHeaderProps) {
  const { onClose: defaultClose, titleId } = useModalContext();
  const handleClose = customClose ?? defaultClose;

  return (
    <div
      className={cn(
        "z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-white/95 backdrop-blur-md border-b border-zinc-200 shrink-0",
        sticky && "sticky top-0",
        className
      )}
      {...props}
    >
      {/* Title & Description Left Aligned */}
      {title && (
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="text-sm sm:text-base font-bold text-[#211a14] truncate">
            {title}
          </h3>
          {description && (
            <div className="text-xs text-zinc-500 mt-0.5 font-medium flex items-center gap-1.5">
              {description}
            </div>
          )}
        </div>
      )}

      {/* Children fallback */}
      {children}

      {/* Right side: optional action + close button */}
      <div className="flex items-center gap-2 shrink-0">
        {action && <div>{action}</div>}

        {showCloseButton && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ModalBody Component
// ============================================================================

export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {}

export function ModalBody({ className, children, ...props }: ModalBodyProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// ModalFooter Component
// ============================================================================

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  sticky?: boolean;
}

export function ModalFooter({
  sticky = true,
  className,
  style,
  children,
  ...props
}: ModalFooterProps) {
  return (
    <div
      className={cn(
        "z-30 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-t border-zinc-200 shrink-0 shadow-lg",
        sticky && "sticky bottom-0",
        className
      )}
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
