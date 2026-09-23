"use client";

// One image library per dish. Upload as many as you like, then choose which
// one is the main image and (optionally) which is the transparent cutout —
// nothing is promoted automatically behind your back.

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Scissors, Star, Trash2, UploadCloud } from "lucide-react";
import { UploadButton } from "@/components/ui/upload-button";
import { useToast } from "@/components/ui/toast";
import { cloudinaryReady, uploadToCloudinary } from "@/lib/cloudinary";
import {
  createMenuItemPhoto,
  deleteMenuItemPhoto,
  listMenuItemPhotos,
  removeImageBackground,
  type AdminMenuItemPhoto,
} from "@/lib/admin-api";
import {
  getRatioClassification,
  validateDishImageFile,
  type ImageValidationResult,
} from "@/lib/image-validation";

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
  const [preservedUrls, setPreservedUrls] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState<
    Record<string, { w: number; h: number; ratioLabel: string; isStandard: boolean }>
  >({});
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const refreshPhotos = () =>
    queryClient.invalidateQueries({ queryKey: ["admin"] });

  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  });

  const inspectDimensions = useCallback((url: string) => {
    if (!url || typeof window === "undefined") return;
    const testImg = new window.Image();
    testImg.onload = () => {
      const w = testImg.naturalWidth;
      const h = testImg.naturalHeight;
      if (!w || !h) return;
      const r = w / h;
      const cls = getRatioClassification(r);
      setDimensions((prev) => {
        if (prev[url] && prev[url].w === w && prev[url].h === h) return prev;
        return {
          ...prev,
          [url]: {
            w,
            h,
            ratioLabel: cls.label,
            isStandard: cls.isStandard,
          },
        };
      });
    };
    testImg.src = url;
  }, []);

  useEffect(() => {
    const urlsToAdd: string[] = [];
    if (mainUrl && !preservedUrls.includes(mainUrl)) urlsToAdd.push(mainUrl);
    if (cutoutUrl && !preservedUrls.includes(cutoutUrl)) urlsToAdd.push(cutoutUrl);
    if (urlsToAdd.length > 0) {
      setPreservedUrls((prev) => Array.from(new Set([...prev, ...urlsToAdd])));
    }
  }, [mainUrl, cutoutUrl]);

  const photosQuery = useQuery({
    queryKey: ["admin", "menu", slug, "photos"],
    queryFn: () => listMenuItemPhotos(slug),
    enabled: Boolean(slug),
  });
  useEffect(() => {
    if (!slug) setPhotos([]);
    else if (photosQuery.data) {
      setPhotos(photosQuery.data);
      onCountChangeRef.current?.(slug, photosQuery.data.length);
    } else if (photosQuery.isError) setPhotos([]);
  }, [slug, photosQuery.data, photosQuery.isError]);
  const createPhotoMutation = useMutation({
    mutationFn: createMenuItemPhoto,
    onSettled: refreshPhotos,
  });
  const deletePhotoMutation = useMutation({
    mutationFn: deleteMenuItemPhoto,
    onSettled: refreshPhotos,
  });
  const uploadMutation = useMutation({
    mutationFn: ({ file, name }: { file: Blob; name?: string }) => uploadToCloudinary(file, name),
  });
  const cutoutMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not download that photo for background removal.");
      return removeImageBackground(await response.blob());
    },
  });

  const add = useCallback(
    async (url: string, check?: ImageValidationResult) => {
      const specSummary = check?.width && check?.height
        ? ` (${check.width}×${check.height} px · ${check.ratioLabel} · ${check.fileSizeMB} MB)`
        : "";

      if (!slug) {
        // no dish row yet: hold the URL and attach it the moment it's created
        onPendingChange?.((prev) => [...prev, url]);
        if (!mainUrl) onSetMain(url);
        toast({
          variant: "success",
          title: "✓ Photo Validated & Staged",
          description: `Passed size & ratio checks${specSummary}. Will be saved with dish.`,
        });
        return;
      }
      try {
        const created = await createPhotoMutation.mutateAsync({
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
        onCountChangeRef.current?.(slug, count);
        if (!mainUrl) onSetMain(url);
        toast({
          variant: "success",
          title: "✓ Photo Validated & Added",
          description: `Passed all size and ratio specifications${specSummary}.`,
        });
      } catch (e) {
        toast({ variant: "error", title: "Upload failed", description: e instanceof Error ? e.message : undefined });
      }
    },
    [slug, name, photos, toast, onPendingChange, mainUrl, onSetMain]
  );

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!cloudinaryReady) return;
    const files = [...e.dataTransfer.files].filter(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|avif|heic)$/i.test(f.name)
    );
    if (files.length === 0) return;

    setBusy("Uploading photo…");
    for (const file of files) {
      const check = await validateDishImageFile(file);
      if (!check.valid) {
        toast({
          variant: "error",
          title: "❌ Upload Blocked by Validation",
          description: check.error,
        });
        continue;
      }
      if (check.warning) {
        toast({
          variant: "info",
          title: "Aspect ratio note",
          description: check.warning,
        });
      }
      try {
        const uploadedUrl = await uploadMutation.mutateAsync({ file });
        await add(uploadedUrl, check);
      } catch (err) {
        toast({ variant: "error", title: "Upload failed", description: err instanceof Error ? err.message : undefined });
      }
    }
    setBusy("");
  };

  const remove = async (p: AdminMenuItemPhoto) => {
    if (busy) return; // one photo mutation at a time — no double-delete 404s
    setBusy("Removing photo…");
    try {
      await deletePhotoMutation.mutateAsync(p.id);
      let count = 0;
      setPhotos((ps) => {
        const next = (ps ?? []).filter((x) => x.id !== p.id);
        count = next.length;
        return next;
      });
      onCountChangeRef.current?.(slug, count);
      // never leave a selection pointing at a deleted file
      if (p.image === mainUrl) onSetMain("");
      if (p.image === cutoutUrl) onSetCutout("");
      toast({ variant: "success", title: "Photo removed" });
    } catch (e) {
      toast({ variant: "error", title: "Could not remove photo", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy("");
    }
  };

  /** cut the background out of an existing photo and use it as the cutout */
  const makeCutout = async (url: string) => {
    setBusy("Extracting transparent cutout with AI…");
    try {
      const cutBlob = await cutoutMutation.mutateAsync(url);
      const newCutoutUrl = await uploadMutation.mutateAsync({ file: cutBlob, name: "cutout.png" });
      onSetCutout(newCutoutUrl);
      // Automatically make cutout active on storefront
      onSetMain(newCutoutUrl);
      toast({
        variant: "success",
        title: "✂️ Cutout Sticker Created!",
        description: "Background removed. Cutout is now active on public menu cards.",
      });
    } catch (e) {
      toast({ variant: "error", title: "Could not make a cutout", description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy("");
    }
  };

  const knownUrls = new Set((photos ?? []).map((p) => p.image).concat(pending));
  const extraTiles = preservedUrls
    .filter((url) => !knownUrls.has(url))
    .map((url, i) => ({ key: `preserved-${url || i}`, url, photo: null }));

  const tiles = [
    ...(photos ?? []).map((p) => ({ key: `p${p.id}`, url: p.image, photo: p })),
    ...pending.map((url, i) => ({ key: `s${i}`, url, photo: null })),
    ...extraTiles,
  ];

  useEffect(() => {
    tiles.forEach((t) => {
      if (t.url && !dimensions[t.url]) {
        inspectDimensions(t.url);
      }
    });
  }, [tiles, dimensions, inspectDimensions]);

  return (
    <div className="space-y-4">
      {/* Upload Specifications & Quality Guide Bar */}
      <details className="group rounded-xl border border-amber-300/80 bg-linear-to-r from-amber-50/90 via-amber-50/60 to-orange-50/40 p-3 shadow-2xs">
        <summary className="flex items-center justify-between gap-2 cursor-pointer list-none select-none text-xs font-bold text-amber-950">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-amber-900 text-xs shrink-0">📷</span>
            <span className="text-xs font-bold">Photo Sizing &amp; Ratio Guide</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/60 hidden sm:inline-flex">
              ✓ Auto Optimized
            </span>
            <span className="text-xs text-amber-800 font-bold group-open:rotate-180 transition-transform">▼</span>
          </div>
        </summary>

        <div className="mt-3 space-y-2.5 pt-2 border-t border-amber-200/60">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/90 rounded-lg p-2.5 border border-amber-200/80 shadow-2xs flex flex-col">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                📐 Aspect Ratio
              </span>
              <span className="text-xs font-extrabold text-zinc-900 mt-0.5">4:3 or 1:1</span>
              <span className="text-[10px] text-emerald-700 font-medium">✓ Validated on upload</span>
            </div>

            <div className="bg-white/90 rounded-lg p-2.5 border border-amber-200/80 shadow-2xs flex flex-col">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                🎯 Resolution
              </span>
              <span className="text-xs font-extrabold text-zinc-900 mt-0.5">1200 × 900 px</span>
              <span className="text-[10px] text-emerald-700 font-medium">✓ Min 500×400px enforced</span>
            </div>

            <div className="bg-white/90 rounded-lg p-2.5 border border-amber-200/80 shadow-2xs flex flex-col">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                ⚖️ Max File Size
              </span>
              <span className="text-xs font-extrabold text-amber-700 mt-0.5">Max 5 MB</span>
              <span className="text-[10px] text-emerald-700 font-medium">✓ Strictly checked</span>
            </div>

            <div className="bg-white/90 rounded-lg p-2.5 border border-amber-200/80 shadow-2xs flex flex-col">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                📁 File Formats
              </span>
              <span className="text-xs font-extrabold text-zinc-900 mt-0.5">JPG, WebP, PNG</span>
              <span className="text-[10px] text-emerald-700 font-medium">✓ Pre-screened</span>
            </div>
          </div>

          <div className="text-[11px] text-amber-950/90 font-medium flex items-center gap-1.5 pt-0.5">
            <span>💡 <strong>Composition rule:</strong> Shoot at a 30°–45° diner angle with 10% breathing margin around the plate so circular cards don&apos;t clip the edges.</span>
          </div>
        </div>
      </details>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`grid gap-4 rounded-xl border border-dashed p-5 transition-colors ${
          dragging ? "border-zinc-900 bg-zinc-50" : "border-zinc-300 bg-zinc-50/40"
        }`}
      >
        {photos === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tiles.length === 0 ? (
          <div className="grid justify-items-center gap-2 py-6 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-900">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-zinc-900">Drop dish photos here, or click Add photos</p>
            <p className="text-xs text-zinc-500 max-w-sm">
              Recommended: 1200×900 px (4:3 ratio) · Max 5MB per file · JPG, WebP, PNG (All validated)
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((t) => {
              const isCut = t.url === cutoutUrl || t.url.includes("-cutout") || t.url.includes("cutout.png");
              const isMain = t.url === mainUrl;
              return (
                <div
                  key={t.key}
                  className={`relative overflow-hidden rounded-xl transition-all duration-200 ${
                    isCut
                      ? isMain
                        ? "border-2 border-emerald-600 bg-emerald-50/30 shadow-md ring-2 ring-emerald-600/20"
                        : "border border-emerald-300 bg-white hover:border-emerald-400 shadow-xs"
                      : isMain
                      ? "border-2 border-zinc-900 bg-white shadow-md ring-2 ring-zinc-900/10"
                      : "border border-zinc-200 bg-white hover:border-zinc-300 shadow-xs"
                  }`}
                >
                  <div className={`relative aspect-square ${isCut ? "bg-transparency-grid" : "bg-muted"}`}>
                    <Image
                      src={t.url}
                      alt=""
                      fill
                      sizes="200px"
                      className={isCut ? "object-contain p-2.5" : "object-cover"}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          const w = img.naturalWidth;
                          const h = img.naturalHeight;
                          const r = w / h;
                          const cls = getRatioClassification(r);
                          setDimensions((prev) => ({
                            ...prev,
                            [t.url]: {
                              w,
                              h,
                              ratioLabel: cls.label,
                              isStandard: cls.isStandard,
                            },
                          }));
                        }
                      }}
                    />
                    {dimensions[t.url] && (
                      <div className="absolute right-1.5 bottom-1.5 rounded bg-black/75 backdrop-blur-xs px-1.5 py-0.5 text-[9px] font-mono font-medium text-white shadow-xs flex items-center gap-1 z-10 pointer-events-none">
                        <span>{dimensions[t.url].w}×{dimensions[t.url].h}</span>
                        <span className="text-zinc-400">·</span>
                        <span className={dimensions[t.url].isStandard ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                          {dimensions[t.url].ratioLabel}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
                    {isCut ? (
                      <span className="rounded bg-emerald-700/95 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-xs flex items-center gap-1">
                        <Scissors className="h-2.5 w-2.5" /> Cutout Sticker
                      </span>
                    ) : (
                      isMain && (
                        <span className="rounded bg-zinc-900/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-xs flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> Active on Site
                        </span>
                      )
                    )}
                  </div>

                  {/* Tier 1: Primary Action - Full Width Storefront Display Toggle */}
                  <div className="border-t border-zinc-200">
                    <button
                      type="button"
                      className={`w-full min-h-[36px] flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold transition-colors cursor-pointer ${
                        isCut
                          ? isMain
                            ? "bg-emerald-700 text-white font-bold"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold"
                          : isMain
                          ? "bg-zinc-900 text-white font-bold"
                          : "bg-white hover:bg-amber-50/80 text-zinc-700 hover:text-amber-950 font-medium"
                      }`}
                      onClick={() => onSetMain(isMain ? "" : t.url)}
                      title={isMain ? "Active on public menu — click to unset" : "Click to display this image on the public site"}
                    >
                      {isCut ? (
                        <Scissors className={`h-3.5 w-3.5 shrink-0 ${isMain ? "text-white" : "text-emerald-700"}`} />
                      ) : (
                        <Star className={`h-3.5 w-3.5 shrink-0 ${isMain ? "fill-amber-400 text-amber-400" : "text-zinc-400"}`} />
                      )}
                      <span className="truncate">
                        {isCut
                          ? isMain
                            ? "Active as Cutout"
                            : "Show Cutout on Site"
                          : isMain
                          ? "Active as Photo"
                          : "Show Photo on Site"}
                      </span>
                    </button>
                  </div>

                  {/* Tier 2: Secondary Actions */}
                  {isCut ? (
                    <div className="border-t border-zinc-200 text-[11px] bg-zinc-50/60">
                      <button
                        type="button"
                        className="w-full min-h-[34px] flex items-center justify-center gap-1 py-1.5 px-2 font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                        onClick={() => {
                          onSetCutout("");
                          if (t.url === mainUrl) onSetMain("");
                          setPreservedUrls((prev) => prev.filter((u) => u !== t.url));
                          toast({ variant: "info", title: "Cutout removed" });
                        }}
                        title="Remove this cutout"
                      >
                        <Trash2 className="h-3 w-3 shrink-0 text-red-500" />
                        <span className="truncate">Remove Cutout</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 divide-x divide-zinc-200 border-t border-zinc-200 text-[11px] bg-zinc-50/60">
                      <button
                        type="button"
                        className="min-h-[34px] flex items-center justify-center gap-1 py-1.5 px-1.5 font-medium text-emerald-800 hover:bg-emerald-50 hover:text-emerald-950 transition-colors cursor-pointer overflow-hidden"
                        onClick={() => makeCutout(t.url)}
                        title="Remove the background of this photo to create a transparent sticker"
                      >
                        <Scissors className="h-3 w-3 shrink-0 text-emerald-600" />
                        <span className="truncate"><span className="hidden sm:inline">Make </span>Cutout</span>
                      </button>
                      <button
                        type="button"
                        className="min-h-[34px] flex items-center justify-center gap-1 py-1.5 px-1.5 font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-40 cursor-pointer overflow-hidden"
                        onClick={() => {
                          if (t.photo) return remove(t.photo);
                          if (pending.includes(t.url)) {
                            onPendingChange?.((prev) => prev.filter((u) => u !== t.url));
                            if (t.url === mainUrl) onSetMain("");
                            if (t.url === cutoutUrl) onSetCutout("");
                            return;
                          }
                          setPreservedUrls((prev) => prev.filter((u) => u !== t.url));
                          if (t.url === mainUrl) onSetMain("");
                          if (t.url === cutoutUrl) onSetCutout("");
                        }}
                        title="Delete this photo"
                      >
                        <Trash2 className="h-3 w-3 shrink-0 text-red-500" />
                        <span className="truncate">Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashed border-zinc-200">
          <div className="flex items-center gap-3">
            <UploadButton multiple label="Add photos" onUploaded={add} />
            <span className="text-xs text-zinc-600 font-medium">
              {busy || "Select multiple food shots (Max 5MB each)"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 font-semibold">
            <span className="px-2 py-0.5 bg-white rounded-md border border-zinc-200 text-zinc-700">4:3 or 1:1</span>
            <span className="px-2 py-0.5 bg-amber-50 rounded-md border border-amber-200 text-amber-800">Max 5MB</span>
            <span className="px-2 py-0.5 bg-white rounded-md border border-zinc-200 text-zinc-700">JPG, PNG, WebP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
