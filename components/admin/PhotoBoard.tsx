"use client";

// One image library per dish. Upload as many as you like, then choose which
// one is the main image and (optionally) which is the transparent cutout —
// nothing is promoted automatically behind your back.

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Scissors, Star, Trash2, UploadCloud } from "lucide-react";
import { UploadButton } from "@/components/ui/upload-button";
import { useToast } from "@/components/ui/toast";
import { API_URL } from "@/lib/api";
import { cloudinaryReady, uploadToCloudinary } from "@/lib/cloudinary";
import {
  createMenuItemPhoto,
  deleteMenuItemPhoto,
  getToken,
  listMenuItemPhotos,
  type AdminMenuItemPhoto,
} from "@/lib/admin-api";

export default function PhotoBoard({
  slug,
  name,
  mainUrl,
  cutoutUrl,
  onSetMain,
  onSetCutout,
  onCountChange,
  pending = [],
  onPendingChange,
}: {
  /** empty while the dish is still being created — uploads are staged */
  slug: string;
  name: string;
  mainUrl: string;
  cutoutUrl: string;
  onSetMain: (url: string) => void;
  onSetCutout: (url: string) => void;
  onCountChange?: (slug: string, count: number) => void;
  pending?: string[];
  /** a state setter, not a plain value callback: multi-file uploads run in a
      loop and would otherwise each overwrite the previous one */
  onPendingChange?: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [photos, setPhotos] = useState<AdminMenuItemPhoto[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) { setPhotos([]); return; }
    listMenuItemPhotos(slug).then(setPhotos).catch(() => setPhotos([]));
  }, [slug]);

  const add = useCallback(
    async (url: string) => {
      if (!slug) {
        // no dish row yet: hold the URL and attach it the moment it's created
        onPendingChange?.((prev) => [...prev, url]);
        return;
      }
      try {
        const created = await createMenuItemPhoto({
          menu_item: slug,
          image: url,
          alt: `${name} photo`,
          sort_order: photos?.length ?? 0,
        });
        let count = 0;
        setPhotos((ps) => {
          const next = [...(ps ?? []), created];
          count = next.length;
          return next;
        });
        onCountChange?.(slug, count);
      } catch (e) {
        toast({ variant: "error", title: "Upload failed", description: e instanceof Error ? e.message : undefined });
      }
    },
    [slug, name, photos, onCountChange, toast, onPendingChange]
  );

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!cloudinaryReady) return;
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setBusy("Uploading…");
    for (const file of files) {
      try {
        await add(await uploadToCloudinary(file));
      } catch (err) {
        toast({ variant: "error", title: "Upload failed", description: err instanceof Error ? err.message : undefined });
      }
    }
    setBusy("");
  };

  const remove = async (p: AdminMenuItemPhoto) => {
    try {
      await deleteMenuItemPhoto(p.id);
      let count = 0;
      setPhotos((ps) => {
        const next = (ps ?? []).filter((x) => x.id !== p.id);
        count = next.length;
        return next;
      });
      onCountChange?.(slug, count);
      // never leave a selection pointing at a deleted file
      if (p.image === mainUrl) onSetMain("");
      if (p.image === cutoutUrl) onSetCutout("");
      toast({ variant: "success", title: "Photo removed" });
    } catch (e) {
      toast({ variant: "error", title: "Could not remove photo", description: e instanceof Error ? e.message : undefined });
    }
  };

  /** cut the background out of an existing photo and use it as the cutout */
  const makeCutout = async (url: string) => {
    setBusy("Removing background…");
    try {
      const file = await (await fetch(url)).blob();
      const form = new FormData();
      form.append("file", new File([file], "dish.png", { type: file.type || "image/png" }));
      const res = await fetch(`${API_URL}/admin/remove-bg/`, {
        method: "POST",
        headers: { Authorization: `Token ${getToken()}` },
        body: form,
      });
      if (!res.ok) throw new Error("Background removal failed — try a photo on a plain background");
      onSetCutout(await uploadToCloudinary(await res.blob(), "cutout.png"));
      toast({ variant: "success", title: "Cutout created from this photo" });
    } catch (e) {
      toast({ variant: "error", title: "Could not make a cutout", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy("");
    }
  };

  const tiles = [
    ...(photos ?? []).map((p) => ({ key: `p${p.id}`, url: p.image, photo: p })),
    ...pending.map((url, i) => ({ key: `s${i}`, url, photo: null })),
    // selections that aren't in the library yet (e.g. seeded paths) still show
    ...(mainUrl && !(photos ?? []).some((p) => p.image === mainUrl)
      ? [{ key: "main", url: mainUrl, photo: null }] : []),
    ...(cutoutUrl && !(photos ?? []).some((p) => p.image === cutoutUrl) && cutoutUrl !== mainUrl
      ? [{ key: "cut", url: cutoutUrl, photo: null }] : []),
  ];

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`grid gap-4 rounded-lg border border-dashed p-5 transition-colors ${
        dragging ? "border-zinc-900 bg-zinc-50" : "border-border"
      }`}
    >
      {photos === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tiles.length === 0 ? (
        <div className="grid justify-items-center gap-2 py-4 text-center">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drop photos here, or pick files</p>
          <p className="text-xs text-muted-foreground">
            {slug ? "Then choose which one is the main image" : "They attach to the dish when you save it"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t) => {
            const isMain = t.url === mainUrl;
            const isCut = t.url === cutoutUrl;
            return (
              <div
                key={t.key}
                className={`relative overflow-hidden rounded-md border ${
                  isMain ? "border-zinc-900" : "border-border"
                }`}
              >
                <div className="relative aspect-square bg-muted">
                  <Image src={t.url} alt="" fill sizes="200px" className="object-cover" />
                </div>
                <div className="absolute left-1 top-1 flex flex-wrap gap-1">
                  {isMain && (
                    <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">Main</span>
                  )}
                  {isCut && (
                    <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">Cutout</span>
                  )}
                </div>
                <div className="grid grid-cols-3 divide-x border-t text-[11px]">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1 py-1.5 font-medium hover:bg-muted disabled:opacity-40"
                    onClick={() => onSetMain(isMain ? "" : t.url)}
                    title={isMain ? "Unset main image" : "Use as the main image"}
                  >
                    <Star className={`h-3 w-3 ${isMain ? "fill-current" : ""}`} /> Main
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1 py-1.5 font-medium hover:bg-muted"
                    onClick={() => makeCutout(t.url)}
                    title="Remove the background and use it as the cutout"
                  >
                    <Scissors className="h-3 w-3" /> Cutout
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-1 py-1.5 font-medium text-destructive hover:bg-muted disabled:opacity-40"
                    onClick={() => {
                      if (t.photo) return remove(t.photo);
                      if (pending.includes(t.url)) {
                        onPendingChange?.((prev) => prev.filter((u) => u !== t.url));
                        if (t.url === mainUrl) onSetMain("");
                        if (t.url === cutoutUrl) onSetCutout("");
                        return;
                      }
                      if (isMain) onSetMain(""); else onSetCutout("");
                    }}
                    title="Remove this image"
                  >
                    <Trash2 className="h-3 w-3" /> Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <UploadButton multiple label="Add photos" onUploaded={add} />
        <span className="text-xs text-muted-foreground">
          {busy || "Upload as many as you like, then press ★ Main on the one customers should see first."}
        </span>
      </div>
    </div>
  );
}
