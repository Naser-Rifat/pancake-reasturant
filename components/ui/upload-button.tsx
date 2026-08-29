"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import { getToken } from "@/lib/admin-api";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

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
}: {
  onUploaded?: (url: string) => void;
  /** dual mode: one pick returns BOTH the original photo and its cutout */
  onPair?: (urls: { photo: string; cutout: string }) => void;
  cutout?: boolean;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"" | "cutting" | "uploading">("");
  const [error, setError] = useState("");

  if (!CLOUD || !PRESET) return null;

  const toCloudinary = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", PRESET);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
      method: "POST",
      body: form,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error?.message ?? "Upload failed");
    // serve every upload optimised (WebP/AVIF + right quality) forever
    return (body.secure_url as string).replace("/upload/", "/upload/f_auto,q_auto/");
  };

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
        const photo = await toCloudinary(file);
        setStage("cutting");
        const cut = await removeBg(file);
        setStage("uploading");
        onPair({ photo, cutout: await toCloudinary(cut) });
        return;
      }
      let payload: File = file;
      if (cutout) {
        setStage("cutting");
        payload = await removeBg(file);
      }
      setStage("uploading");
      onUploaded?.(await toCloudinary(payload));
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
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
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
