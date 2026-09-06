"use client";

import type { ComponentProps, ReactNode } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * THE primary save/submit button of the admin — one place for the brand
 * color, typography and spinner, instead of the same class string pasted
 * into every form. Pass `icon={false}` for text-only actions.
 */
export function SaveButton({
  children,
  icon = true,
  className = "",
  ...props
}: ComponentProps<typeof Button> & { icon?: boolean }) {
  return (
    <Button
      size="sm"
      className={`bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs ${className}`}
      {...props}
    >
      {icon && <Save className="h-3.5 w-3.5 mr-1.5" />}
      {children}
    </Button>
  );
}

/** Right-aligned action bar that closes a form card — save lives here, at
 *  the end of the fields, never up in the card header. */
export function SaveBar({ children }: { children: ReactNode }) {
  return <div className="flex justify-end pt-3 border-t border-zinc-200">{children}</div>;
}
