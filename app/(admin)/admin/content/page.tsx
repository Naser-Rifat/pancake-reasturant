"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import {
  createAnnouncement,
  createCertification,
  createGalleryPhoto,
  deleteCertification,
  deleteGalleryPhoto,
  getSiteSettings,
  listAnnouncements,
  listCertifications,
  listGalleryAdmin,
  updateAnnouncement,
  updateCertification,
  updateSiteSettings,
  type AdminAnnouncement,
  type AdminCertification,
  type AdminGalleryPhoto,
  type AdminSiteSettings,
} from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/components/ui/upload-button";

const EMPTY_PHOTO: Pick<AdminGalleryPhoto, "album" | "caption" | "image" | "alt"> = {
  album: "food",
  caption: "",
  image: "",
  alt: "",
};
const EMPTY_CERT = { icon: "🏅", title: "", subtitle: "" };

export default function ContentPage() {
  const [site, setSite] = useState<AdminSiteSettings | null>(null);
  const [announcement, setAnnouncement] = useState<AdminAnnouncement | null>(null);
  const [certs, setCerts] = useState<AdminCertification[]>([]);
  const [photos, setPhotos] = useState<AdminGalleryPhoto[]>([]);
  const [newPhoto, setNewPhoto] = useState(EMPTY_PHOTO);
  const [newCert, setNewCert] = useState(EMPTY_CERT);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    Promise.all([getSiteSettings(), listAnnouncements(), listCertifications(), listGalleryAdmin()])
      .then(([s, anns, cs, ps]) => {
        setSite(s);
        setAnnouncement(anns[0] ?? null);
        setCerts(cs);
        setPhotos(ps);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const flash = (what: string) => {
    setSaved(what);
    setTimeout(() => setSaved(""), 1800);
  };

  const run = async (fn: () => Promise<void>, what: string) => {
    setError("");
    try {
      await fn();
      flash(what);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  if (!site) return error ? <p className="text-sm font-medium text-destructive">{error}</p> : null;

  const setS = (key: keyof AdminSiteSettings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setSite((s) => (s ? { ...s, [key]: e.target.value } : s));

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site content</h1>
          <p className="text-sm text-muted-foreground">
            Everything shown on the public website — changes go live immediately
          </p>
        </div>
        {saved && <span className="text-sm font-medium text-emerald-600">{saved} saved ✓</span>}
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {/* ---------- hero + about ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Hero &amp; about</CardTitle>
          <CardDescription>The big banner and the welcome text on the home page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="hero-heading">Hero heading</Label>
              <Input id="hero-heading" value={site.hero_heading} onChange={setS("hero_heading")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="hero-script">Hero script word (pink cursive)</Label>
              <Input id="hero-script" value={site.hero_script} onChange={setS("hero_script")} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="hero-lead">Hero tagline</Label>
              <Textarea id="hero-lead" value={site.hero_lead} onChange={setS("hero_lead")} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="hero-image">Hero image</Label>
              <div className="flex items-center gap-2">
                <Input id="hero-image" value={site.hero_image} onChange={setS("hero_image")} />
                <UploadButton onUploaded={(url) => setSite((s) => (s ? { ...s, hero_image: url } : s))} />
              </div>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="about-text">About text</Label>
              <Textarea id="about-text" rows={4} value={site.about_text} onChange={setS("about_text")} />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  hero_heading: site.hero_heading,
                  hero_script: site.hero_script,
                  hero_lead: site.hero_lead,
                  hero_image: site.hero_image,
                  about_text: site.about_text,
                });
              }, "Hero & about")
            }
          >
            Save hero &amp; about
          </Button>
        </CardContent>
      </Card>

      {/* ---------- announcement bar ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Announcement bar</CardTitle>
          <CardDescription>The black promo strip across the top of the website</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="ann-message">Message</Label>
              <Input
                id="ann-message"
                value={announcement?.message ?? ""}
                onChange={(e) =>
                  setAnnouncement((a) => ({ ...(a ?? { id: 0, link_text: "", link_url: "", is_active: true }), message: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ann-linktext">Link text</Label>
              <Input
                id="ann-linktext"
                value={announcement?.link_text ?? ""}
                onChange={(e) => setAnnouncement((a) => (a ? { ...a, link_text: e.target.value } : a))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ann-linkurl">Link URL</Label>
              <Input
                id="ann-linkurl"
                placeholder="/booking"
                value={announcement?.link_url ?? ""}
                onChange={(e) => setAnnouncement((a) => (a ? { ...a, link_url: e.target.value } : a))}
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch
                checked={announcement?.is_active ?? false}
                onCheckedChange={(v) => setAnnouncement((a) => (a ? { ...a, is_active: v } : a))}
              />
              Show on website
            </label>
            <Button
              onClick={() =>
                run(async () => {
                  if (!announcement) return;
                  if (announcement.id) await updateAnnouncement(announcement.id, announcement);
                  else setAnnouncement(await createAnnouncement(announcement));
                }, "Announcement")
              }
            >
              Save announcement
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---------- certifications ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Certifications &amp; awards</CardTitle>
          <CardDescription>The badges in the &ldquo;Certified &amp; Award-Winning&rdquo; strip</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {certs.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
              <Input
                className="w-14 text-center"
                value={c.icon}
                onChange={(e) => setCerts((xs) => xs.map((x) => (x.id === c.id ? { ...x, icon: e.target.value } : x)))}
              />
              <Input
                className="min-w-40 flex-1"
                value={c.title}
                onChange={(e) => setCerts((xs) => xs.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)))}
              />
              <Input
                className="min-w-40 flex-1"
                value={c.subtitle}
                placeholder="Subtitle"
                onChange={(e) => setCerts((xs) => xs.map((x) => (x.id === c.id ? { ...x, subtitle: e.target.value } : x)))}
              />
              <label className="flex items-center gap-1.5 text-xs font-medium">
                <Switch checked={c.is_active} onCheckedChange={(v) =>
                  run(async () => {
                    await updateCertification(c.id, { is_active: v });
                    setCerts((xs) => xs.map((x) => (x.id === c.id ? { ...x, is_active: v } : x)));
                  }, "Certification")
                } />
                Shown
              </label>
              <Button size="sm" variant="outline" onClick={() =>
                run(async () => {
                  await updateCertification(c.id, { icon: c.icon, title: c.title, subtitle: c.subtitle });
                }, "Certification")
              }>
                Save
              </Button>
              <Button size="icon" variant="ghost" aria-label={`Delete ${c.title}`} onClick={() =>
                run(async () => {
                  if (!confirm(`Delete “${c.title}”?`)) return;
                  await deleteCertification(c.id);
                  setCerts((xs) => xs.filter((x) => x.id !== c.id));
                }, "Certification")
              }>
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-2">
            <Input className="w-14 text-center" value={newCert.icon}
              onChange={(e) => setNewCert((n) => ({ ...n, icon: e.target.value }))} />
            <Input className="min-w-40 flex-1" placeholder="New award title"
              value={newCert.title} onChange={(e) => setNewCert((n) => ({ ...n, title: e.target.value }))} />
            <Input className="min-w-40 flex-1" placeholder="Subtitle"
              value={newCert.subtitle} onChange={(e) => setNewCert((n) => ({ ...n, subtitle: e.target.value }))} />
            <Button size="sm" disabled={!newCert.title.trim()} onClick={() =>
              run(async () => {
                const created = await createCertification({ ...newCert, sort_order: certs.length });
                setCerts((xs) => [...xs, created]);
                setNewCert(EMPTY_CERT);
              }, "Certification")
            }>
              <Plus /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---------- gallery ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery photos</CardTitle>
          <CardDescription>Shown on the Gallery page and the home-page preview</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {photos.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-md border">
                <Image src={p.image} alt={p.alt} width={300} height={200} sizes="200px" className="h-24 w-full object-cover" />
                <Badge variant="secondary" className="absolute left-1 top-1 capitalize">{p.album}</Badge>
                <button
                  aria-label={`Delete photo: ${p.caption}`}
                  className="absolute right-1 top-1 rounded bg-white/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() =>
                    run(async () => {
                      if (!confirm("Remove this photo from the gallery?")) return;
                      await deleteGalleryPhoto(p.id);
                      setPhotos((xs) => xs.filter((x) => x.id !== p.id));
                    }, "Gallery")
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid gap-2 rounded-md border border-dashed p-3 sm:grid-cols-5">
            <Select className="h-9" value={newPhoto.album}
              onChange={(e) => setNewPhoto((n) => ({ ...n, album: e.target.value as AdminGalleryPhoto["album"] }))}>
              <option value="food">Food</option>
              <option value="interior">Interior</option>
              <option value="events">Events</option>
            </Select>
            <div className="flex items-center gap-2">
              <Input placeholder="Image URL *" value={newPhoto.image}
                onChange={(e) => setNewPhoto((n) => ({ ...n, image: e.target.value }))} />
              <UploadButton onUploaded={(url) => setNewPhoto((n) => ({ ...n, image: url }))} />
            </div>
            <Input placeholder="Caption *" value={newPhoto.caption}
              onChange={(e) => setNewPhoto((n) => ({ ...n, caption: e.target.value }))} />
            <Input placeholder="Alt text *" value={newPhoto.alt}
              onChange={(e) => setNewPhoto((n) => ({ ...n, alt: e.target.value }))} />
            <Button disabled={!newPhoto.image.trim() || !newPhoto.caption.trim() || !newPhoto.alt.trim()}
              onClick={() =>
                run(async () => {
                  const created = await createGalleryPhoto({ ...newPhoto, sort_order: photos.length });
                  setPhotos((xs) => [...xs, created]);
                  setNewPhoto(EMPTY_PHOTO);
                }, "Gallery")
              }>
              <Plus /> Add photo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
