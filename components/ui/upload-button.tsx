"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads an image straight to Cloudinary (unsigned preset, plain REST — no SDK)
 * and hands back the delivery URL with auto format/quality optimisation baked in.
 * Renders nothing when Cloudinary isn't configured, so URL inputs keep working.
 */
export function UploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!CLOUD || !PRESET) return null;

  const upload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
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
      onUploaded((body.secure_url as string).replace("/upload/", "/upload/f_auto,q_auto/"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
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
        disabled={busy}
        onClick={() => fileRef.current?.click()}
      >
        <Upload /> {busy ? "Uploading…" : "Upload"}
      </Button>
      {error && <span className="text-xs font-medium text-destructive">{error}</span>}
    </span>
  );
}
