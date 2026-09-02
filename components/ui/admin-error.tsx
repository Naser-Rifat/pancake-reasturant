import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminErrorProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export function AdminError({
  message = "Failed to load data from the server. Please check your connection or CORS settings.",
  onRetry,
  title = "Something went wrong",
  className = "",
}: AdminErrorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-6 rounded-xl border border-destructive/30 bg-destructive/5 text-center my-4 ${className}`}
      role="alert"
    >
      <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </Button>
      )}
    </div>
  );
}
