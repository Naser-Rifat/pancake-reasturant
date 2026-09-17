"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeImageBackground } from "@/lib/admin-api";
import { cloudinaryReady, uploadToCloudinary } from "@/lib/cloudinary";
import { useToast } from "@/components/ui/toast";
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  validateDishImageFile,
  type ImageValidationResult,
} from "@/lib/image-validation";

/**
 * Uploads an image straight to Cloudinary (unsigned preset, plain REST — no SDK)
 * and hands back the delivery URL with auto format/quality optimisation baked in.
 * With `cutout`, the photo is first sent through our backend's background
 * remover, so any picture the client uploads becomes a transparent PNG.
 * Renders nothing when Cloudinary isn't configured, so URL inputs keep working.
 */
export function UploadButton({
  onUploaded,
  onPair,
  onLocalPreview,
  cutout = false,
  label = "Upload",
  multiple = false,
  disabled = false,
  validate,
  dropzone = false,
}: {
  onUploaded?: (
    url: string,
    check?: ImageValidationResult,
  ) => void | Promise<void>;
  /** dual mode: one pick returns BOTH the original photo and its cutout */
  onPair?: (urls: { photo: string; cutout: string }) => void | Promise<void>;
  /** Temporary object URL shown immediately while validation/upload runs. */
  onLocalPreview?: (url: string | null) => void;
  cutout?: boolean;
  label?: string;
  /** let staff pick several files in one go — onUploaded fires per file */
  multiple?: boolean;
  disabled?: boolean;
  /** custom pre-flight validation callback */
  validate?: (file: File) => Promise<ImageValidationResult>;
  /** Allows files to be dropped onto the control in addition to file-picker use. */
  dropzone?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"" | "cutting" | "uploading">("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const removeBgMutation = useMutation({
    mutationFn: async (file: File) => {
      const blob = await removeImageBackground(file);
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-cutout.png", {
        type: "image/png",
      });
    },
  });
  const cloudUploadMutation = useMutation({
    mutationFn: (file: Blob | File) => uploadToCloudinary(file),
  });

  if (!cloudinaryReady) return null;

  const upload = async (file: File) => {
    setError("");
    setStage("uploading");
    const localPreview = URL.createObjectURL(file);
    onLocalPreview?.(localPreview);

    try {
      // If custom validation was passed, run it; otherwise run default dish validator
      const validator = validate ?? validateDishImageFile;
      const check = await validator(file);
      if (!check.valid) {
        const errMsg = check.error || "Image validation failed";
        setError(errMsg);
        toast({
          variant: "error",
          title: "❌ Upload Blocked by Validation",
          description: errMsg,
        });
        return;
      }
      if (check.warning) {
        toast({
          variant: "info",
          title: "Aspect ratio note",
          description: check.warning,
        });
      }

      if (onPair) {
        const photo = await cloudUploadMutation.mutateAsync(file);
        setStage("cutting");
        const cut = await removeBgMutation.mutateAsync(file);
        setStage("uploading");
        await onPair({ photo, cutout: await cloudUploadMutation.mutateAsync(cut) });
        return;
      }
      let payload: File = file;
      if (cutout) {
        setStage("cutting");
        payload = await removeBgMutation.mutateAsync(file);
        setStage("uploading");
      }
      const uploadedUrl = await cloudUploadMutation.mutateAsync(payload);
      if (onUploaded) {
        await onUploaded(uploadedUrl, check);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Upload failed";
      setError(errMsg);
      toast({ variant: "error", title: "Upload failed", description: errMsg });
    } finally {
      onLocalPreview?.(null);
      URL.revokeObjectURL(localPreview);
      setStage("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <span
      className={dropzone ? "flex w-full flex-wrap items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-2" : "inline-flex flex-wrap items-center gap-2"}
      onDragOver={dropzone ? (event) => event.preventDefault() : undefined}
      onDrop={dropzone ? (event) => {
        event.preventDefault();
        if (disabled || stage) return;
        const files = [...event.dataTransfer.files];
        void (async () => {
          for (const file of multiple ? files : files.slice(0, 1)) await upload(file);
        })();
      } : undefined}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        multiple={multiple}
        disabled={disabled || stage !== ""}
        onChange={async (e) => {
          const files = [...(e.target.files ?? [])];
          for (const f of files) await upload(f);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={stage !== ""}
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
      >
        <Upload />
        {stage === "cutting"
          ? "Removing background…"
          : stage === "uploading"
            ? "Validating & Uploading…"
            : label}
      </Button>
      {dropzone && stage === "" && <span className="text-[10px] font-medium text-zinc-500">or drag &amp; drop here</span>}
      {error && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <span>⚠️</span>
          <span>{error}</span>
        </span>
      )}
    </span>
  );
}
