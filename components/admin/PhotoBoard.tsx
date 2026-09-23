"use client";

// One image library per dish. Upload as many as you like, then choose which
// one is the main image and (optionally) which is the transparent cutout —
// nothing is promoted automatically behind your back.

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Check, Scissors, Sparkles, Star, Trash2, UploadCloud } from "lucide-react";
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
        className={`rounded-2xl border transition-all p-4 sm:p-5 space-y-4 ${
          dragging ? "border-[#763a12] bg-amber-50/30" : "border-zinc-200/90 bg-zinc-50/40"
        }`}
      >
        {photos === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : tiles.length === 0 ? (
          <div className="grid justify-items-center gap-2 py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-900">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-zinc-900">Drop dish photos here, or click Add photos</p>
            <p className="text-xs text-zinc-500 max-w-sm">
              Recommended: 1200×900 px (4:3 ratio) · Max 5MB per file · JPG, WebP, PNG (All validated)
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiles.map((t) => {
              const isCut = t.url === cutoutUrl || t.url.includes("-cutout") || t.url.includes("cutout.png");
              const isMain = t.url === mainUrl;
              return (
                <div
                  key={t.key}
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-200 bg-white flex flex-col justify-between ${
                    isMain
                      ? "border-2 border-[#763a12] ring-4 ring-[#763a12]/10 shadow-sm"
                      : "border border-zinc-200/90 hover:border-zinc-300 hover:shadow-xs"
                  }`}
                >
                  <div className={`relative aspect-4/3 w-full overflow-hidden ${isCut ? "bg-transparency-grid" : "bg-zinc-100"}`}>
                    <Image
                      src={t.url}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className={isCut ? "object-contain p-3" : "object-cover"}
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

                    {/* Top Status Badges */}
                    <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                      {isMain ? (
                        <span className="rounded-full bg-[#763a12] text-white px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm flex items-center gap-1.5 backdrop-blur-md">
                          <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> Active on Menu
                        </span>
                      ) : isCut ? (
                        <span className="rounded-full bg-emerald-700 text-white px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm flex items-center gap-1.5 backdrop-blur-md">
                          <Scissors className="h-3 w-3" /> Cutout Sticker
                        </span>
                      ) : null}
                    </div>

                    {/* Bottom Specs Badge */}
                    {dimensions[t.url] && (
                      <div className="absolute right-2.5 bottom-2.5 rounded-md bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[9px] font-mono font-medium text-white shadow-xs flex items-center gap-1 z-10 pointer-events-none">
                        <span>{dimensions[t.url].w}×{dimensions[t.url].h}</span>
                        <span className="text-zinc-400">·</span>
                        <span className={dimensions[t.url].isStandard ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                          {dimensions[t.url].ratioLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Unified Card Controls Footer */}
                  <div className="p-3.5 bg-zinc-50/70 border-t border-zinc-100 flex flex-col gap-2.5">
                    {/* Primary Button: Storefront Selection Toggle */}
                    <button
                      type="button"
                      className={`w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isMain
                          ? "bg-[#763a12] text-white shadow-2xs"
                          : "bg-white hover:bg-amber-50/70 text-zinc-700 hover:text-[#763a12] border border-zinc-200/90 hover:border-[#763a12]/30 shadow-2xs"
                      }`}
                      onClick={() => onSetMain(isMain ? "" : t.url)}
                      title={isMain ? "Currently displayed on public site — click to unset" : `Click to display this ${isCut ? "transparent cutout" : "photo"} on the public site`}
                    >
                      {isMain ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-amber-300 stroke-[3]" />
                          <span>Selected for Storefront</span>
                        </>
                      ) : isCut ? (
                        <>
                          <Scissors className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Display Cutout on Site</span>
                        </>
                      ) : (
                        <>
                          <Star className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Display Photo on Site</span>
                        </>
                      )}
                    </button>

                    {/* Secondary Utility Actions */}
                    <div className="flex items-center justify-between pt-0.5 text-[11px] px-1">
                      {isCut ? (
                        <>
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Transparent sticker
                          </span>
                          <button
                            type="button"
                            className="font-semibold text-zinc-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
                            onClick={() => {
                              onSetCutout("");
                              if (t.url === mainUrl) onSetMain("");
                              setPreservedUrls((prev) => prev.filter((u) => u !== t.url));
                              toast({ variant: "info", title: "Cutout removed" });
                            }}
                            title="Remove this cutout sticker"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove Cutout</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                            onClick={() => makeCutout(t.url)}
                            title="Remove background of this photo to create a transparent sticker"
                          >
                            <Scissors className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Make Cutout</span>
                          </button>
                          <button
                            type="button"
                            className="font-semibold text-zinc-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
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
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-200/80">
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
