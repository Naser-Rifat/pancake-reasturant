import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { Plus, Save, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UploadButton } from "@/components/ui/upload-button";
import { useConfirm } from "@/components/ui/confirm";
import {
  createGalleryPhoto,
  deleteGalleryPhoto,
  updateGalleryPhoto,
  updateSiteSettings,
  type AdminGalleryPhoto,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import { EMPTY_PHOTO, type NewPhoto, type RunSave, type SetSiteField } from "../_lib";

// Content studio panel for the /gallery page (header copy + photo album manager).
export function GalleryPageSection({
  site,
  setS,
  photos,
  setPhotos,
  galleryFilter,
  setGalleryFilter,
  newPhoto,
  setNewPhoto,
  busy,
  run,
}: {
  site: AdminSiteSettings;
  setS: SetSiteField;
  photos: AdminGalleryPhoto[];
  setPhotos: Dispatch<SetStateAction<AdminGalleryPhoto[]>>;
  galleryFilter: string;
  setGalleryFilter: Dispatch<SetStateAction<string>>;
  newPhoto: NewPhoto;
  setNewPhoto: Dispatch<SetStateAction<NewPhoto>>;
  busy: string;
  run: RunSave;
}) {
  const { confirm: confirmDialog } = useConfirm();
  const filteredPhotos =
    galleryFilter === "all" ? photos : photos.filter((p) => p.album === galleryFilter);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white uppercase tracking-wide">
              Gallery Header
            </span>
            <h3 className="text-base font-semibold text-[#211a14]">Gallery Top Title</h3>
          </div>
          <Button
            size="sm"
            className="font-bold text-xs bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
            loading={busy === "Gallery hero"}
            onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  gallery_hero_kicker: site.gallery_hero_kicker,
                  gallery_hero_heading: site.gallery_hero_heading,
                  gallery_hero_script: site.gallery_hero_script,
                  gallery_hero_lead: site.gallery_hero_lead,
                });
              }, "Gallery hero")
            }
          >
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Header
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Small Top Kicker</Label>
            <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.gallery_hero_kicker} onChange={setS("gallery_hero_kicker")} placeholder="Feast Your Eyes" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Main Word</Label>
            <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl" value={site.gallery_hero_heading} onChange={setS("gallery_hero_heading")} placeholder="The" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Handwriting Word</Label>
            <Input className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl font-serif italic" value={site.gallery_hero_script} onChange={setS("gallery_hero_script")} placeholder="Gallery." />
          </div>
          <div className="sm:col-span-3 space-y-1">
            <Label className="text-xs font-semibold text-[#211a14]">Subtitle</Label>
            <Input className="border-zinc-300 text-[#211a14] font-medium text-sm h-10 rounded-xl" value={site.gallery_hero_lead} onChange={setS("gallery_hero_lead")} placeholder="Our food, our space, and the good times in between." />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white uppercase tracking-wide">
              Photo Albums
            </span>
            <h3 className="text-base font-semibold text-[#211a14]">All Uploaded Photos ({photos.length})</h3>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-lg border border-zinc-200">
            {[
              { id: "all", label: "All" },
              { id: "food", label: "Food" },
              { id: "interior", label: "Interior" },
              { id: "events", label: "Events" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setGalleryFilter(cat.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  galleryFilter === cat.id
                    ? "bg-[#763a12] text-white shadow-xs"
                    : "text-[#763a12] hover:text-[#211a14]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add photos to any album — the homepage strip shows the first 6 overall */}
        <div className="p-4 rounded-lg border border-dashed border-zinc-300 bg-white">
          <div className="grid gap-3 sm:grid-cols-5 [&>*]:min-w-0">
            <Select
              className="h-10 text-xs border-zinc-300 font-bold rounded-xl"
              value={newPhoto.album}
              onChange={(e) =>
                setNewPhoto((n) => ({ ...n, album: e.target.value as AdminGalleryPhoto["album"] }))
              }
            >
              <option value="food">Food &amp; Dishes</option>
              <option value="interior">Interior &amp; Space</option>
              <option value="events">Events &amp; Parties</option>
            </Select>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Input
                className="h-10 text-xs border-zinc-300 font-medium rounded-xl"
                placeholder="Image URL or click upload"
                value={newPhoto.image}
                onChange={(e) => setNewPhoto((n) => ({ ...n, image: e.target.value }))}
              />
              <UploadButton onUploaded={(url) => setNewPhoto((n) => ({ ...n, image: url }))} />
            </div>
            <Input
              className="h-10 text-xs border-zinc-300 font-medium rounded-xl"
              placeholder="Caption (e.g. Fluffy Berry Stack)"
              value={newPhoto.caption}
              onChange={(e) => setNewPhoto((n) => ({ ...n, caption: e.target.value }))}
            />
            <Button
              className="h-10 text-xs font-bold bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
              disabled={!newPhoto.image.trim() || !newPhoto.caption.trim()}
              loading={busy === "Gallery"}
              onClick={() =>
                run(async () => {
                  const created = await createGalleryPhoto({
                    ...newPhoto,
                    sort_order: photos.length,
                  });
                  setPhotos((xs) => [...xs, created]);
                  setNewPhoto(EMPTY_PHOTO);
                }, "Gallery", { title: "Photo added" })
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Photo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 [&>*]:min-w-0">
          {filteredPhotos.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white p-2 shadow-xs hover:border-zinc-300 transition-all"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100">
                <Image
                  src={p.image}
                  alt={p.caption}
                  fill
                  sizes="300px"
                  className="object-cover"
                  style={{ objectPosition: `50% ${p.focus === "top" ? "18%" : p.focus === "bottom" ? "82%" : "50%"}` }}
                />
                <Badge className="absolute left-1.5 top-1.5 capitalize text-[10px] font-semibold bg-zinc-950 text-white border-0">
                  {p.album}
                </Badge>
                <button
                  className="absolute right-1.5 top-1.5 rounded-lg bg-black/80 text-white p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive transition-opacity"
                  aria-label={`Remove photo “${p.caption || "Untitled"}”`}
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: `Remove “${p.caption || "this photo"}” from the gallery?`,
                      description: "It also leaves the homepage strip if it was one of the first six.",
                      confirmLabel: "Remove photo",
                      destructive: true,
                    });
                    if (!ok) return;
                    run(async () => {
                      await deleteGalleryPhoto(p.id);
                      setPhotos((xs) => xs.filter((x) => x.id !== p.id));
                    }, "Gallery", { title: "Photo removed" });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-1.5 p-1.5 pt-2">
                <Input
                  key={`gcap-${p.id}`}
                  defaultValue={p.caption}
                  placeholder="Caption…"
                  className="h-8 text-xs border-zinc-200 font-medium rounded-lg"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v === p.caption) return;
                    run(async () => {
                      await updateGalleryPhoto(p.id, { caption: v });
                      setPhotos((xs) => xs.map((x) => (x.id === p.id ? { ...x, caption: v } : x)));
                    }, "Caption", { title: "Caption saved" });
                  }}
                />
                <div className="flex items-center gap-1.5 [&>*]:min-w-0">
                  <Select
                    className="h-8 flex-1 text-xs border-zinc-200 font-bold rounded-lg"
                    aria-label="Which part of the photo stays visible when cropped"
                    value={p.focus}
                    onChange={(e) =>
                      run(async () => {
                        const focus = e.target.value as AdminGalleryPhoto["focus"];
                        await updateGalleryPhoto(p.id, { focus });
                        setPhotos((xs) => xs.map((x) => (x.id === p.id ? { ...x, focus } : x)));
                      }, "Photo crop", { title: "Crop focus saved" })
                    }
                  >
                    <option value="center">Focus: Centre</option>
                    <option value="top">Focus: Top</option>
                    <option value="bottom">Focus: Bottom</option>
                  </Select>
                  <UploadButton
                    label="Replace"
                    onUploaded={(url) =>
                      run(async () => {
                        await updateGalleryPhoto(p.id, { image: url });
                        setPhotos((xs) => xs.map((x) => (x.id === p.id ? { ...x, image: url } : x)));
                      }, "Gallery", { title: "Photo replaced" })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
