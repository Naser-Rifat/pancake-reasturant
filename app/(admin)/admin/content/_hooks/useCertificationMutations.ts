"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import {
  createCertification,
  deleteCertification,
  updateCertification,
  type AdminCertification,
} from "@/lib/admin-api";
import { EMPTY_CERT, type NewCert } from "../_lib";

export interface UpdateCertificationVariables {
  id: number;
  patch: Partial<AdminCertification>;
  successTitle: string;
  errorHandledByCaller?: boolean;
}

interface Options {
  setCerts: Dispatch<SetStateAction<AdminCertification[]>>;
  setNewCert: Dispatch<SetStateAction<NewCert>>;
}

export function useCertificationMutations({ setCerts, setNewCert }: Options) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const refreshContent = () =>
    queryClient.invalidateQueries({ queryKey: ["admin"] });

  const update = useMutation({
    mutationKey: ["certifications", "update"],
    mutationFn: ({ id, patch }: UpdateCertificationVariables) =>
      updateCertification(id, patch),
    onSuccess: (saved, variables) => {
      setCerts((rows) =>
        rows.map((row) => (row.id === saved.id ? saved : row)),
      );
      toast({ variant: "success", title: variables.successTitle });
    },
    onError: (error, variables) => {
      if (variables.errorHandledByCaller) return;
      toast({
        variant: "error",
        title: "Certification could not be updated",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    },
    onSettled: refreshContent,
  });

  const create = useMutation({
    mutationKey: ["certifications", "create"],
    mutationFn: createCertification,
    onSuccess: (created) => {
      setCerts((rows) => [...rows, created]);
      setNewCert(EMPTY_CERT);
      toast({ variant: "success", title: "Badge added" });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: "Badge could not be added",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    },
    onSettled: refreshContent,
  });

  const remove = useMutation({
    mutationKey: ["certifications", "delete"],
    mutationFn: deleteCertification,
    onSuccess: (_data, id) => {
      setCerts((rows) => rows.filter((row) => row.id !== id));
      toast({ variant: "success", title: "Badge deleted" });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: "Badge could not be deleted",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    },
    onSettled: refreshContent,
  });

  return {
    update,
    create,
    remove,
    isPending: update.isPending || create.isPending || remove.isPending,
  };
}
