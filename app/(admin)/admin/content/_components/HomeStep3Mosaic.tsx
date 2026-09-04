import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadButton } from "@/components/ui/upload-button";
import { useConfirm } from "@/components/ui/confirm";
import {
  createGalleryPhoto,
  deleteGalleryPhoto,
  updateGalleryPhoto,
  type AdminGalleryPhoto,
} from "@/lib/admin-api";
import type { PageTab, RunSave } from "../_lib";

// Home studio · Step 3: the 6-slot homepage polaroid photo mosaic.
export function HomeStep3Mosaic({
  photos,
  setPhotos,
  run,
  setHomeStepIndex,
  setActivePage,
}: {
  photos: AdminGalleryPhoto[];
  setPhotos: Dispatch<SetStateAction<AdminGalleryPhoto[]>>;
  run: RunSave;
  setHomeStepIndex: Dispatch<SetStateAction<number>>;
  setActivePage: Dispatch<SetStateAction<PageTab>>;
}) {
  const { confirm: confirmDialog } = useConfirm();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white uppercase tracking-wide">
            Section 3
          </span>
          <div>
            <h3 className="text-base font-semibold text-[#211a14]">Homepage Polaroid Photo Mosaic</h3>
            <p className="text-xs text-zinc-500">The 6 featured scrapbook photos displayed in the homepage gallery strip</p>
          </div>
        </div>
      </div>

      {/* The manager IS the website layout: same mosaic, slot by slot */}
      <p className="text-xs font-medium text-zinc-600 -mt-2">
        This is the exact layout visitors see on the homepage — <strong>slot #1 is the big
        hero shot</strong>. Drop a photo into any empty slot, or use Replace on a filled one.
        Captions save when you click away.
      </p>

      {/* admin bundle doesn't load the public stylesheet, so the exact
          mosaic geometry ships scoped right here (same numbers as
          globals.css .gallery-mosaic) */}
      <style>{`
        .studio-mosaic { display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: 170px; gap: 16px; }
        .studio-mosaic > :first-child { grid-column: span 2; grid-row: span 2; }
        .studio-mosaic > :last-child { grid-column: span 2; }
        @media (min-width: 640px) {
          .studio-mosaic { grid-template-columns: repeat(3, 1fr); grid-auto-rows: 190px; }
          .studio-mosaic > :last-child { grid-column: auto; }
        }
        @media (min-width: 1024px) {
          .studio-mosaic { grid-template-columns: repeat(5, 1fr); grid-auto-rows: 235px; gap: 18px; }
          .studio-mosaic > :last-child { grid-column: span 2; }
        }
        .studio-slot { display: flex; flex-direction: column; background: #fff; padding: 8px 8px 10px; border-radius: 14px; border: 1.5px solid rgba(118, 58, 18, 0.1); box-shadow: 0 8px 20px rgba(33, 26, 20, 0.08); position: relative; min-width: 0; }
        .studio-img { flex: 1; min-height: 0; position: relative; border-radius: 10px; overflow: hidden; background: #f4ebe1; }
      `}</style>
      <div className="studio-mosaic">
        {Array.from({ length: 6 }).map((_, i) => {
          const p = photos[i];
          if (!p) {
            return (
              <div
                key={`empty-${i}`}
                className="studio-slot"
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  border: "2px dashed #d9c7b4",
                  background: "#faf5ee",
                  boxShadow: "none",
                }}
              >
                <span className="text-xs font-semibold text-[#763a12]">
                  Slot #{i + 1}{i === 0 ? " — big hero shot" : ""} · empty
                </span>
                <UploadButton
                  label="Add Photo"
                  onUploaded={(url) =>
                    run(async () => {
                      const created = await createGalleryPhoto({
                        album: "food",
                        caption: "",
                        image: url,
                        alt: "",
                        sort_order: photos.length,
                      });
                      setPhotos((xs) => [...xs, created]);
                    }, "Gallery", { title: `Photo added to slot #${i + 1}` })
                  }
                />
              </div>
            );
          }
          return (
            <div key={p.id} className="studio-slot">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-950 text-white shadow-xs"
                style={{ position: "absolute", top: "10px", left: "10px", zIndex: 6 }}
              >
                #{i + 1}{i === 0 ? " · Hero" : ""}
              </span>
              <button
                type="button"
                className="rounded-lg bg-black/80 text-white p-1.5 hover:bg-destructive transition-colors"
                style={{ position: "absolute", top: "8px", right: "8px", zIndex: 6 }}
                aria-label={`Delete photo “${p.caption || "Untitled"}”`}
                onClick={async () => {
                  const ok = await confirmDialog({
                    title: `Delete “${p.caption || "this photo"}”?`,
                    description: "It is removed from the homepage strip and the gallery.",
                    confirmLabel: "Delete photo",
                    destructive: true,
                  });
                  if (!ok) return;
                  run(async () => {
                    await deleteGalleryPhoto(p.id);
                    setPhotos((xs) => xs.filter((x) => x.id !== p.id));
                  }, "Gallery", { title: "Photo deleted" });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <div className="studio-img">
                <Image
                  src={p.image}
                  alt={p.caption || "Gallery photo"}
                  width={900}
                  height={700}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div className="flex items-center gap-1.5 pt-1.5">
                <Input
                  key={`cap-${p.id}`}
                  defaultValue={p.caption}
                  placeholder={i === 0 ? "Hero caption (shows on the website)" : "Caption…"}
                  className="h-8 text-xs border-zinc-200 font-medium rounded-lg min-w-0"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v === p.caption) return;
                    run(async () => {
                      await updateGalleryPhoto(p.id, { caption: v });
                      setPhotos((xs) => xs.map((x) => (x.id === p.id ? { ...x, caption: v } : x)));
                    }, "Caption", { title: "Caption saved" });
                  }}
                />
                <UploadButton
                  label="Replace"
                  onUploaded={(url) =>
                    run(async () => {
                      await updateGalleryPhoto(p.id, { image: url });
                      setPhotos((xs) => xs.map((x) => (x.id === p.id ? { ...x, image: url } : x)));
                    }, "Gallery", { title: `Slot #${i + 1} photo replaced!` })
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] font-medium text-zinc-500">
        Want more than 6 photos, albums, or the full gallery page? Manage everything in the{" "}
        <button type="button" className="font-semibold text-[#763a12] underline" onClick={() => setActivePage("gallery")}>
          Gallery Page tab
        </button>
        .
      </p>


      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200">
        <Button
          type="button"
          variant="outline"
          className="gap-2 text-xs font-bold border-zinc-300 text-[#763a12] rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(2)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous: Step 2 (Deals &amp; Campaigns)</span>
        </Button>
        <Button
          type="button"
          className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(4)}
        >
          <span>Next: Step 4 (Trust Badges)</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
