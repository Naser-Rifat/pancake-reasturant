"use client";

// Image input that stays compact until there's something to show.
// Empty: a small dropzone with the target ratio. Filled: the exact crop the
// site uses, plus replace/remove. The raw URL box hides behind a toggle —
// staff upload, developers paste.

import { useState } from "react";
import Image from "next/image";
import { ImageOff, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadButton } from "@/components/ui/upload-button";

const CHECKER =
  "repeating-conic-gradient(#e6e6e6 0% 25%, #ffffff 0% 50%) 50% / 16px 16px";

export function ImageField({
  id,
  label,
  hint,
  ratio,
  value,
  onChange,
  onUploaded,
  cutout = false,
  fit = "cover",
}: {
  id: string;
  label: string;
  hint: string;
  ratio: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploaded: (url: string) => void;
  cutout?: boolean;
  fit?: "cover" | "contain";
}) {
  const [showUrl, setShowUrl] = useState(false);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {hint}
        </span>
      </div>

      {value ? (
        <div className="flex flex-wrap items-start gap-3">
          <div
            className="relative w-40 shrink-0 overflow-hidden rounded-md border bg-muted"
            style={{ aspectRatio: ratio, background: fit === "contain" ? CHECKER : undefined }}
          >
            <Image
              src={value}
              alt=""
              fill
              sizes="160px"
              className={fit === "contain" ? "object-contain p-2" : "object-cover"}
            />
          </div>
          <div className="grid gap-2">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {fit === "cover"
                ? "This is the crop the website uses — keep the dish near the centre."
                : "Transparent PNG — the checkerboard is the see-through area."}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <UploadButton cutout={cutout} label="Replace" onUploaded={onUploaded} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onUploaded("")}
              >
                <ImageOff /> Remove
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowUrl((v) => !v)}>
                <Link2 /> {showUrl ? "Hide URL" : "URL"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 rounded-md border-2 border-dashed p-4">
          <div className="flex flex-wrap items-center gap-3">
            <UploadButton cutout={cutout} label="Upload" onUploaded={onUploaded} />
            <span className="text-xs text-muted-foreground">
              {cutout ? "Transparent PNG — background removed for you." : `Crops to ${hint.split(" · ")[0]}, subject centred.`}
            </span>
          </div>
          <button
            type="button"
            className="justify-self-start text-xs font-medium text-muted-foreground underline underline-offset-2"
            onClick={() => setShowUrl((v) => !v)}
          >
            {showUrl ? "Hide URL field" : "or paste a URL"}
          </button>
        </div>
      )}

      {showUrl && (
        <Input id={id} value={value} onChange={onChange} placeholder="https://…" />
      )}
    </div>
  );
}
