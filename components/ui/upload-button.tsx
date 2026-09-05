"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/admin-api";
import { cloudinaryReady, uploadToCloudinary } from "@/lib/cloudinary";

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
  cutout = false,
  label = "Upload",
  multiple = false,
}: {
  onUploaded?: (url: string) => void;
  /** dual mode: one pick returns BOTH the original photo and its cutout */
  onPair?: (urls: { photo: string; cutout: string }) => void;
  cutout?: boolean;
  label?: string;
  /** let staff pick several files in one go — onUploaded fires per file */
  multiple?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"" | "cutting" | "uploading">("");
  const [error, setError] = useState("");

  if (!cloudinaryReady) return null;

  const removeBg = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_URL}/admin/remove-bg/`, {
      method: "POST",
      headers: { Authorization: `Token ${getToken()}` },
      body: form,
    });
    if (!res.ok) throw new Error("Background removal failed — try a photo on a plain, light background");
    const blob = await res.blob();
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + "-cutout.png", { type: "image/png" });
  };

  const upload = async (file: File) => {
    setError("");
    try {
      if (onPair) {
        setStage("uploading");
        const photo = await uploadToCloudinary(file);
        setStage("cutting");
        const cut = await removeBg(file);
        setStage("uploading");
        onPair({ photo, cutout: await uploadToCloudinary(cut) });
        return;
      }
      let payload: File = file;
      if (cutout) {
        setStage("cutting");
        payload = await removeBg(file);
      }
      setStage("uploading");
      onUploaded?.(await uploadToCloudinary(payload));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setStage("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        multiple={multiple}
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
        onClick={() => fileRef.current?.click()}
      >
        <Upload />
        {stage === "cutting" ? "Removing background…" : stage === "uploading" ? "Uploading…" : label}
      </Button>
      {error && <span className="text-xs font-medium text-destructive">{error}</span>}
    </span>
  );
}
