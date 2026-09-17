"use client";

import { useId, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { sendTestEmail } from "@/lib/admin-api";

export function EmailTestPanel({
  defaultRecipient,
  className = "",
}: {
  defaultRecipient: string;
  className?: string;
}) {
  const { toast } = useToast();
  const inputId = useId();
  const [recipient, setRecipient] = useState(defaultRecipient);
  const normalizedRecipient = recipient.trim();
  const recipientLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecipient);

  const testEmail = useMutation({
    mutationFn: (to: string) => sendTestEmail(to),
    onSuccess: (res) => {
      if (!res.ok) {
        toast({ variant: "error", title: "Test email failed", description: res.detail });
        return;
      }
      toast({
        variant: "success",
        title: `Test email accepted for ${res.to}`,
        description: res.detail,
      });
    },
    onError: (error) =>
      toast({
        variant: "error",
        title: "Test email failed",
        description: error instanceof Error ? error.message : "Unknown error",
      }),
  });

  return (
    <form
      className={`rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-3 ${className}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (recipientLooksValid) testEmail.mutate(normalizedRecipient);
      }}
    >
      <div className="flex items-start gap-2">
        <Mail className="h-4 w-4 mt-0.5 text-[#763a12] shrink-0" aria-hidden="true" />
        <div>
          <p className="text-xs font-bold text-[#763a12]">Test email delivery</p>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            Uses the configured production provider. This address is only used for this test and
            does not change the public contact email.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-2.5">
        <div className="space-y-1 flex-1">
          <Label htmlFor={inputId} className="text-xs font-semibold text-[#211a14]">
            Test recipient
          </Label>
          <Input
            id={inputId}
            type="email"
            required
            autoComplete="email"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="you@example.com"
            className="h-10 bg-white border-zinc-300 rounded-xl"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          loading={testEmail.isPending}
          disabled={!recipientLooksValid || testEmail.isPending}
          className="h-10 font-bold text-xs border-amber-300 text-[#763a12] bg-white hover:bg-amber-50 rounded-xl shrink-0 cursor-pointer"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" /> Send Test Email
        </Button>
      </div>
    </form>
  );
}
