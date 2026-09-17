"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast, type ToastInput } from "@/components/ui/toast";

interface SaveJob {
  action: () => Promise<void>;
  label: string;
  success?: ToastInput;
}

export function useRunSave() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["admin", "save"],
    mutationFn: ({ action }: SaveJob) => action(),
    onSuccess: async (_data, job) => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({ variant: "success", title: `${job.label} saved`, ...job.success });
    },
    onError: (error, job) => {
      toast({
        variant: "error",
        title: `${job.label} — could not save`,
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });

  return {
    busy: mutation.isPending ? (mutation.variables?.label ?? "") : "",
    run: (action: () => Promise<void>, label: string, success?: ToastInput) =>
      mutation.mutateAsync({ action, label, success }).catch(() => undefined),
  };
}
