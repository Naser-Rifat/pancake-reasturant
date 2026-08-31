"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import {
  createAnnouncement,
  createCertification,
  deleteAnnouncement,
  createGalleryPhoto,
  deleteCertification,
  deleteGalleryPhoto,
  getSiteSettings,
  listAnnouncements,
  listCertifications,
  listHomeSteps,
  updateGalleryPhoto,
  updateHomeStep,
  type AdminHomeStep,
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
import { useToast, type ToastInput } from "@/components/ui/toast";
import { CERT_ICONS } from "@/components/CertIcon";
import { ImageField } from "@/components/ui/image-field";

const EMPTY_PHOTO: Pick<AdminGalleryPhoto, "album" | "caption" | "image" | "alt"> = {
  album: "food",
  caption: "",
  image: "",
  alt: "",
};
const EMPTY_CERT = { icon: "medal", title: "", subtitle: "" };

/** <input type="datetime-local"> speaks local time without a zone; the API speaks ISO. */
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

export default function ContentPage() {
  const [site, setSite] = useState<AdminSiteSettings | null>(null);
  // the home page runs campaigns as a slider, so this is a list now; the form
  // below still edits one at a time through the shim under it
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [certs, setCerts] = useState<AdminCertification[]>([]);
  const [photos, setPhotos] = useState<AdminGalleryPhoto[]>([]);
  const [newPhoto, setNewPhoto] = useState(EMPTY_PHOTO);
  const [newCert, setNewCert] = useState(EMPTY_CERT);
  const [steps, setSteps] = useState<AdminHomeStep[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getSiteSettings(), listAnnouncements(), listCertifications(), listGalleryAdmin(), listHomeSteps()])
      .then(([s, anns, cs, ps, st]) => {
        setSite(s);
        setAnnouncements(anns);
        setSelectedId(anns[0]?.id ?? null);
        setCerts(cs);
        setPhotos(ps);
        setSteps(st);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const announcement =
    announcements.find((a) => a.id === selectedId) ?? announcements[0] ?? null;
  const setAnnouncement = (
    next: AdminAnnouncement | null | ((a: AdminAnnouncement | null) => AdminAnnouncement | null),
  ) => {
    setAnnouncements((xs) => {
      const current = xs.find((a) => a.id === selectedId) ?? xs[0] ?? null;
      const value = typeof next === "function" ? next(current) : next;
      if (!value) return xs;
      return current ? xs.map((a) => (a.id === current.id ? value : a)) : [...xs, value];
    });
  };

  const run = async (fn: () => Promise<void>, what: string, success?: ToastInput) => {
    setBusy(what);
    try {
      await fn();
      toast({ variant: "success", title: `${what} saved`, ...success });
    } catch (e) {
      toast({
        variant: "error",
        title: `${what} — action failed`,
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy("");
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
      </div>

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
            <div className="sm:col-span-2">
              <ImageField
                id="hero-image"
                label="Hero image"
                hint="Square 1:1 · 1400×1400px"
                ratio="1 / 1"
                value={site.hero_image}
                onChange={setS("hero_image")}
                onUploaded={(url) => setSite((s) => (s ? { ...s, hero_image: url } : s))}
              />
            </div>
            <div className="sm:col-span-2">
              <ImageField
                id="hero-cutout"
                label="Hero dish cutout (the round badge inside the headline)"
                hint="Transparent PNG · square works best · 600px+"
                ratio="1 / 1"
                fit="contain"
                cutout
                value={site.hero_cutout}
                onChange={setS("hero_cutout")}
                onUploaded={(url) => setSite((s) => (s ? { ...s, hero_cutout: url } : s))}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="about-text">About text</Label>
              <Textarea id="about-text" rows={4} value={site.about_text} onChange={setS("about_text")} />
            </div>
          </div>
          <Button
            className="mt-4"
            loading={busy === "Hero & about"}
            onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  hero_heading: site.hero_heading,
                  hero_script: site.hero_script,
                  hero_lead: site.hero_lead,
                  hero_image: site.hero_image,
                  hero_cutout: site.hero_cutout,
                  about_text: site.about_text,
                });
              }, "Hero & about")
            }
          >
            Save hero &amp; about
          </Button>
        </CardContent>
      </Card>

      {/* ---------- home page blocks ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Home page blocks</CardTitle>
          <CardDescription>
            The About block, the three pickup steps, the closing banner and the ticker strip —
            all of this used to be fixed in the code
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8">
          {/* about */}
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="text-sm font-semibold sm:col-span-2">About block</p>
            <div className="grid gap-1.5">
              <Label htmlFor="about-heading">Heading</Label>
              <Input id="about-heading" value={site.about_heading} onChange={setS("about_heading")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="about-script">Script word (cursive)</Label>
              <Input id="about-script" value={site.about_script} onChange={setS("about_script")} />
            </div>
            {([1, 2, 3] as const).map((n) => {
              const key = `about_image_${n}` as "about_image_1" | "about_image_2" | "about_image_3";
              return (
                <div key={key} className={n === 1 ? "sm:col-span-2" : ""}>
                  <ImageField
                    id={key}
                    label={n === 1 ? "Collage photo 1 (large — the room)" : `Collage photo ${n} (small)`}
                    hint={n === 1 ? "4:3 · 1200×900px" : "4:3 · 800×600px"}
                    ratio="4 / 3"
                    value={site[key]}
                    onChange={setS(key)}
                    onUploaded={(url) => setSite((v) => (v ? { ...v, [key]: url } : v))}
                  />
                </div>
              );
            })}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="about-points">Tick list — one per line</Label>
              <Textarea id="about-points" rows={4} value={site.about_points} onChange={setS("about_points")} />
              <p className="text-xs text-muted-foreground">
                These are public claims. Only list what the kitchen can back up.
              </p>
            </div>
          </div>

          {/* pickup steps */}
          <div className="grid gap-4">
            <p className="text-sm font-semibold">Pickup steps — shown on the Menu page</p>
            {steps.map((st) => (
              <div key={st.id} className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`step-label-${st.id}`}>Badge</Label>
                  <Input
                    id={`step-label-${st.id}`}
                    value={st.label}
                    onChange={(e) => setSteps((xs) => xs.map((x) => (x.id === st.id ? { ...x, label: e.target.value } : x)))}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`step-title-${st.id}`}>Title</Label>
                  <Input
                    id={`step-title-${st.id}`}
                    value={st.title}
                    onChange={(e) => setSteps((xs) => xs.map((x) => (x.id === st.id ? { ...x, title: e.target.value } : x)))}
                  />
                </div>
                <div className="grid gap-1.5 sm:col-span-2">
                  <Label htmlFor={`step-text-${st.id}`}>Description</Label>
                  <Textarea
                    id={`step-text-${st.id}`}
                    rows={2}
                    value={st.text}
                    onChange={(e) => setSteps((xs) => xs.map((x) => (x.id === st.id ? { ...x, text: e.target.value } : x)))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <ImageField
                    id={`step-image-${st.id}`}
                    label="Step photo"
                    hint="4:3 · 1200×900px"
                    ratio="4 / 3"
                    value={st.image}
                    onChange={(e) => setSteps((xs) => xs.map((x) => (x.id === st.id ? { ...x, image: e.target.value } : x)))}
                    onUploaded={(url) => setSteps((xs) => xs.map((x) => (x.id === st.id ? { ...x, image: url } : x)))}
                  />
                </div>
                <Button
                  variant="outline"
                  className="justify-self-start sm:col-span-2"
                  loading={busy === `Step ${st.id}`}
                  onClick={() =>
                    run(async () => {
                      await updateHomeStep(st.id, { label: st.label, title: st.title, text: st.text, image: st.image });
                    }, `Step ${st.id}`, { title: `${st.label} saved` })
                  }
                >
                  Save {st.label}
                </Button>
              </div>
            ))}
          </div>

          {/* closing banner */}
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="text-sm font-semibold sm:col-span-2">Closing banner</p>
            <div className="grid gap-1.5">
              <Label htmlFor="cta-heading">Heading</Label>
              <Input id="cta-heading" value={site.cta_heading} onChange={setS("cta_heading")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cta-script">Script word (cursive)</Label>
              <Input id="cta-script" value={site.cta_script} onChange={setS("cta_script")} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="cta-lead">Sub-line</Label>
              <Textarea id="cta-lead" rows={2} value={site.cta_lead} onChange={setS("cta_lead")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cta-btn">Button text</Label>
              <Input id="cta-btn" value={site.cta_button_label} onChange={setS("cta_button_label")} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cta-url">Button link</Label>
              <Input id="cta-url" value={site.cta_button_url} onChange={setS("cta_button_url")} />
            </div>
          </div>

          {/* ticker */}
          <div className="grid gap-1.5">
            <Label htmlFor="marquee">Ticker strip — one phrase per line</Label>
            <Textarea id="marquee" rows={4} value={site.marquee_words} onChange={setS("marquee_words")} />
            <p className="text-xs text-muted-foreground">
              Shown on dish pages. &quot;Est. 1999&quot; is a factual claim — confirm the year with the owner.
            </p>
          </div>

          {/* footer */}
          <div className="grid gap-1.5">
            <Label htmlFor="footer-tagline">Footer strapline</Label>
            <Input id="footer-tagline" value={site.footer_tagline} onChange={setS("footer_tagline")} />
            <p className="text-xs text-muted-foreground">
              Sits beside the copyright line. The address, phone and email below it come from Settings.
            </p>
          </div>

          <Button
            className="justify-self-start"
            loading={busy === "Home page blocks"}
            onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  about_heading: site.about_heading,
                  about_script: site.about_script,
                  about_image_1: site.about_image_1,
                  about_image_2: site.about_image_2,
                  about_image_3: site.about_image_3,
                  about_points: site.about_points,
                  cta_heading: site.cta_heading,
                  cta_script: site.cta_script,
                  cta_lead: site.cta_lead,
                  cta_button_label: site.cta_button_label,
                  cta_button_url: site.cta_button_url,
                  marquee_words: site.marquee_words,
                  footer_tagline: site.footer_tagline,
                });
              }, "Home page blocks", { title: "Home page saved", description: "Live on the website now" })
            }
          >
            Save home page blocks
          </Button>
        </CardContent>
      </Card>

      {/* ---------- announcement bar ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            Every live campaign runs in the home-page slider, one at a time. <b>Add an image</b>
            and it also appears on the slim notice bar across the other pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* one card, several campaigns: pick which one the form below edits */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-2">
            {announcements.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedId(a.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  a.id === announcement?.id
                    ? "bg-zinc-900 text-white"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/70"
                }`}
              >
                {a.message.trim().slice(0, 26) || `Campaign ${i + 1}`}
                {!a.is_active && " · off"}
              </button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                run(async () => {
                  const created = await createAnnouncement({
                    message: "New campaign", link_text: "", link_url: "", image: "",
                    starts_at: null, ends_at: null, is_active: false,
                  });
                  setAnnouncements((xs) => [...xs, created]);
                  setSelectedId(created.id);
                }, "Campaign", { title: "Campaign added", description: "Switch it on when the copy is ready" })
              }
            >
              <Plus /> Add campaign
            </Button>
            {announcement && announcements.length > 1 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  run(async () => {
                    if (!confirm(`Delete "${announcement.message.slice(0, 40)}"?`)) return;
                    await deleteAnnouncement(announcement.id);
                    setAnnouncements((xs) => xs.filter((x) => x.id !== announcement.id));
                    setSelectedId(null);
                  }, "Campaign", { title: "Campaign deleted" })
                }
              >
                <Trash2 className="text-destructive" /> Delete
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="ann-message">Message (the headline on the banner)</Label>
              <Input
                id="ann-message"
                value={announcement?.message ?? ""}
                onChange={(e) =>
                  setAnnouncement((a) => ({
                    ...(a ?? { id: 0, details: "", link_text: "", link_url: "", image: "", starts_at: null, ends_at: null, is_active: true }),
                    message: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="ann-details">Conditions (shown under the headline)</Label>
              <Input
                id="ann-details"
                placeholder="e.g. Tuesdays only · dine-in · one per table"
                value={announcement?.details ?? ""}
                onChange={(e) =>
                  setAnnouncement((a) => (a ? { ...a, details: e.target.value } : a))
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
            <div className="grid gap-1.5">
              <Label htmlFor="ann-start">Starts (optional)</Label>
              <Input
                id="ann-start"
                type="datetime-local"
                value={toLocalInput(announcement?.starts_at)}
                onChange={(e) =>
                  setAnnouncement((a) => (a ? { ...a, starts_at: fromLocalInput(e.target.value) } : a))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ann-end">Ends (optional)</Label>
              <Input
                id="ann-end"
                type="datetime-local"
                value={toLocalInput(announcement?.ends_at)}
                onChange={(e) =>
                  setAnnouncement((a) => (a ? { ...a, ends_at: fromLocalInput(e.target.value) } : a))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Leave the dates empty to run it until you switch it off.
            </p>
            <div className="sm:col-span-2">
              <ImageField
                id="ann-image"
                label="Campaign image — switches this from the top bar to a full banner"
                hint="Wide 16:9 · 1600×900px"
                ratio="16 / 9"
                value={announcement?.image ?? ""}
                onChange={(e) => setAnnouncement((a) => (a ? { ...a, image: e.target.value } : a))}
                onUploaded={(url) => setAnnouncement((a) => (a ? { ...a, image: url } : a))}
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
              loading={busy === "Announcement"}
              onClick={() =>
                run(async () => {
                  if (!announcement) return;
                  if (announcement.id) await updateAnnouncement(announcement.id, announcement);
                  else setAnnouncement(await createAnnouncement(announcement));
                }, "Campaign", { title: "Campaign saved", description: "Live on the website now" })
              }
            >
              Save campaign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---------- certifications ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Certifications &amp; awards</CardTitle>
          <CardDescription>
            The trust strip above the booking CTA — only list accreditations the
            restaurant actually holds
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {certs.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
              <Select
                className="h-9 w-32"
                value={c.icon}
                onChange={(e) => setCerts((xs) => xs.map((x) => (x.id === c.id ? { ...x, icon: e.target.value } : x)))}
              >
                {!CERT_ICONS.includes(c.icon) && <option value={c.icon}>Custom: {c.icon}</option>}
                {CERT_ICONS.map((ic) => (
                  <option key={ic} value={ic} className="capitalize">{ic}</option>
                ))}
              </Select>
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
                  }, "Certification", { title: v ? "Certification shown on site" : "Certification hidden" })
                } />
                Shown
              </label>
              <Button size="sm" variant="outline" onClick={() =>
                run(async () => {
                  await updateCertification(c.id, { icon: c.icon, title: c.title, subtitle: c.subtitle });
                }, "Certification", { title: "Certification saved" })
              }>
                Save
              </Button>
              <Button size="icon" variant="ghost" aria-label={`Delete ${c.title}`} onClick={() =>
                run(async () => {
                  if (!confirm(`Delete “${c.title}”?`)) return;
                  await deleteCertification(c.id);
                  setCerts((xs) => xs.filter((x) => x.id !== c.id));
                }, "Certification", { title: "Certification deleted" })
              }>
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-2">
            <Select className="h-9 w-32" value={newCert.icon}
              onChange={(e) => setNewCert((n) => ({ ...n, icon: e.target.value }))}>
              {CERT_ICONS.map((ic) => (
                <option key={ic} value={ic} className="capitalize">{ic}</option>
              ))}
            </Select>
            <Input className="min-w-40 flex-1" placeholder="New award title"
              value={newCert.title} onChange={(e) => setNewCert((n) => ({ ...n, title: e.target.value }))} />
            <Input className="min-w-40 flex-1" placeholder="Subtitle"
              value={newCert.subtitle} onChange={(e) => setNewCert((n) => ({ ...n, subtitle: e.target.value }))} />
            <Button size="sm" disabled={!newCert.title.trim()} onClick={() =>
              run(async () => {
                const created = await createCertification({ ...newCert, sort_order: certs.length });
                setCerts((xs) => [...xs, created]);
                setNewCert(EMPTY_CERT);
              }, "Certification", { title: "Certification added" })
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
          <CardDescription>
            Upload any shape — the site crops each photo differently in each place. The two
            previews under every photo show the real crops; change &ldquo;Keep top / middle /
            bottom&rdquo; until both look right.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {photos.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-md border">
                {/* Staff can't "upload the right ratio" — the same photo is cropped
                    to 1.62 on the gallery page and up to 2.42 in the home strip.
                    So show the two real crops instead of quoting a target size. */}
                <div className="relative" style={{ aspectRatio: "1.62" }}>
                  <Image
                    src={p.image}
                    alt={p.alt || p.caption}
                    fill
                    sizes="200px"
                    className="object-cover"
                    style={{ objectPosition: `50% ${p.focus === "top" ? "18%" : p.focus === "bottom" ? "82%" : "50%"}` }}
                  />
                  <span className="absolute bottom-0 right-0 bg-black/65 px-1 text-[10px] font-medium text-white">
                    Gallery
                  </span>
                </div>
                <div className="relative border-t" style={{ aspectRatio: "2.42" }}>
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="200px"
                    className="object-cover"
                    style={{ objectPosition: `50% ${p.focus === "top" ? "18%" : p.focus === "bottom" ? "82%" : "50%"}` }}
                  />
                  <span className="absolute bottom-0 right-0 bg-black/65 px-1 text-[10px] font-medium text-white">
                    Home, widest
                  </span>
                </div>
                <Badge variant="secondary" className="absolute left-1 top-1 capitalize">{p.album}</Badge>
                <button
                  aria-label={`Delete photo: ${p.caption}`}
                  className="absolute right-1 top-1 rounded bg-white/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() =>
                    run(async () => {
                      if (!confirm("Remove this photo from the gallery?")) return;
                      await deleteGalleryPhoto(p.id);
                      setPhotos((xs) => xs.filter((x) => x.id !== p.id));
                    }, "Gallery", { title: "Photo removed from gallery" })
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
                {/* grid cells crop to a fixed shape — this picks which part stays */}
                <Select
                  className="h-8 rounded-none border-0 border-t text-xs"
                  aria-label={`Crop focus for ${p.caption}`}
                  value={p.focus}
                  onChange={(e) => {
                    const focus = e.target.value as AdminGalleryPhoto["focus"];
                    setPhotos((xs) => xs.map((x) => (x.id === p.id ? { ...x, focus } : x)));
                    run(async () => {
                      await updateGalleryPhoto(p.id, { focus });
                    }, "Gallery", { title: "Crop updated" });
                  }}
                >
                  <option value="top">Keep top</option>
                  <option value="center">Keep middle</option>
                  <option value="bottom">Keep bottom</option>
                </Select>
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
              <Input placeholder="Image URL * — any shape, 1200px+ wide" value={newPhoto.image}
                onChange={(e) => setNewPhoto((n) => ({ ...n, image: e.target.value }))} />
              <UploadButton onUploaded={(url) => setNewPhoto((n) => ({ ...n, image: url }))} />
            </div>
            <Input placeholder="Caption *" value={newPhoto.caption}
              onChange={(e) => setNewPhoto((n) => ({ ...n, caption: e.target.value }))} />
            {/* optional: caption covers it unless the photo needs a different
                description for screen readers */}
            <Input placeholder="Alt text — defaults to the caption" value={newPhoto.alt}
              onChange={(e) => setNewPhoto((n) => ({ ...n, alt: e.target.value }))} />
            <Button disabled={!newPhoto.image.trim() || !newPhoto.caption.trim()}
              onClick={() =>
                run(async () => {
                  const created = await createGalleryPhoto({ ...newPhoto, sort_order: photos.length });
                  setPhotos((xs) => [...xs, created]);
                  setNewPhoto(EMPTY_PHOTO);
                }, "Gallery", { title: "Photo added to gallery" })
              }>
              <Plus /> Add photo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
