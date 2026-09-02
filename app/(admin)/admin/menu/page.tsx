"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Image as ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createMenuItem,
  createMenuItemPhoto,
  deleteMenuItem,
  listMenu,
  listMenuItemPhotos,
  updateMenuItem,
  type AdminMenuItem,
} from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import PhotoBoard from "@/components/admin/PhotoBoard";

const TAG_LABEL: Record<AdminMenuItem["tag"], string> = {
  sweet: "Sweet",
  savoury: "Savoury",
  choc: "Choc Loaded",
};

const EMPTY_FORM = {
  slug: "",
  name: "",
  description: "",
  price: "",
  tag: "sweet" as AdminMenuItem["tag"],
  heat: "none" as AdminMenuItem["heat"],
  kcal: "",
  protein_g: "",
  prep_time: "",
  image: "",
  photo: "",
  is_available: true,
  is_featured: false,
};

type FormState = typeof EMPTY_FORM;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function MenuAdminPage() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // null = form closed, "" = adding new, slug = editing that item
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  // photo counts per slug so the list can show them without opening anything
  const [photoCounts, setPhotoCounts] = useState<Record<string, number>>({});
  // uploads made before the dish exists; attached right after it is created
  const [pendingPhotos, setPendingPhotos] = useState<string[]>([]);
  // creating a dish is a two-step wizard; editing shows everything at once
  const [step, setStep] = useState<1 | 2>(1);
  const formRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef<HTMLDivElement>(null);
  const jumpTo = useRef<"top" | "photos">("top");
  const pristine = useRef<FormState>(EMPTY_FORM);
  const { toast } = useToast();

  // the form opens above a long table — bring it into view instead of
  // leaving staff wondering whether the click registered
  useEffect(() => {
    if (editing === null) return;
    // opening from the Photos column lands straight on the uploader
    const target = jumpTo.current === "photos" ? photosRef.current : formRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: jumpTo.current === "photos" ? "center" : "start" });
  }, [editing]);

  const closeForm = () => {
    const dirty = JSON.stringify(pristine.current) !== JSON.stringify(form);
    if (dirty && !confirm("Discard unsaved changes?")) return;
    setEditing(null);
  };

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listMenu()
      .then(async (list) => {
        setItems(list);
        const counts = await Promise.all(
          list.map((i) => listMenuItemPhotos(i.slug).then((ps) => [i.slug, ps.length] as const).catch(() => [i.slug, 0] as const))
        );
        setPhotoCounts(Object.fromEntries(counts));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load menu items"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setPendingPhotos([]);
    setStep(1);
    pristine.current = EMPTY_FORM;
    setEditing("");
    setError("");
  };

  const openEdit = (item: AdminMenuItem, jumpToPhotos = false) => {
    jumpTo.current = jumpToPhotos ? "photos" : "top";
    const next: FormState = {
      slug: item.slug,
      name: item.name,
      description: item.description,
      price: item.price,
      tag: item.tag,
      heat: item.heat,
      kcal: item.kcal?.toString() ?? "",
      protein_g: item.protein_g?.toString() ?? "",
      prep_time: item.prep_time,
      image: item.image,
      photo: item.photo ?? "",
      is_available: item.is_available,
      is_featured: item.is_featured,
    };
    setForm(next);
    pristine.current = next;
    setPendingPhotos([]);
    setStep(1);
    setEditing(item.slug);
    setError("");
  };

  /** don't let staff reach the photo step with an unnamed, priceless dish */
  const goToPhotos = () => {
    const missing = (["name", "price", "description"] as const).find((k) => !form[k].trim());
    if (missing) {
      const el = document.getElementById(`mi-${missing === "description" ? "desc" : missing}`);
      el?.focus();
      toast({ variant: "error", title: `Add the ${missing === "description" ? "description" : missing} first` });
      return;
    }
    setStep(2);
  };

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    const payload: Partial<AdminMenuItem> = {
      slug: editing || form.slug || slugify(form.name),
      name: form.name,
      description: form.description,
      price: form.price,
      tag: form.tag,
      heat: form.heat,
      kcal: form.kcal ? Number(form.kcal) : null,
      protein_g: form.protein_g ? Number(form.protein_g) : null,
      prep_time: form.prep_time,
      image: form.image,
      photo: form.photo,
      is_available: form.is_available,
      is_featured: form.is_featured,
    };
    try {
      if (editing) {
        await updateMenuItem(editing, payload);
        pristine.current = form;
        toast({ variant: "success", title: `${form.name} updated` });
        setEditing(null);
      } else {
        // keep the form open on the new dish: photos need a saved slug, and
        // closing here is exactly where staff lost the thread before
        const created = await createMenuItem(payload);
        // photos uploaded before the dish existed now get their home
        for (const [i, url] of pendingPhotos.entries()) {
          await createMenuItemPhoto({
            menu_item: created.slug,
            image: url,
            alt: `${created.name} photo`,
            sort_order: i,
          });
        }
        setPhotoCounts((c) => ({ ...c, [created.slug]: pendingPhotos.length }));
        setPendingPhotos([]);
        pristine.current = form;
        setEditing(created.slug);
        toast({
          variant: "success",
          title: `${created.name} added to the menu`,
          description: "You can add extra photos now.",
        });
      }
      load();
    } catch (err) {
      toast({
        variant: "error",
        title: "Save failed",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: AdminMenuItem) => {
    if (!confirm(`Delete “${item.name}” from the menu?`)) return;
    try {
      await deleteMenuItem(item.slug);
      toast({ variant: "success", title: `${item.name} deleted from the menu` });
      load();
    } catch (err) {
      toast({
        variant: "error",
        title: "Delete failed",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const toggle = async (item: AdminMenuItem, changes: Partial<AdminMenuItem>, note: string) => {
    const prev = items;
    setItems((xs) => xs.map((x) => (x.slug === item.slug ? { ...x, ...changes } : x)));
    try {
      await updateMenuItem(item.slug, changes);
      toast({ variant: "success", title: note });
    } catch (err) {
      setItems(prev);
      toast({
        variant: "error",
        title: "Update failed",
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
          <p className="text-sm text-muted-foreground">
            Add, edit and remove dishes — changes go live on the website immediately
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus /> Add item
        </Button>
      </div>

      {error && <AdminError message={error} onRetry={load} />}

      {editing !== null && (
        <Card ref={formRef} className="scroll-mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {editing ? form.name || "Edit dish" : step === 1 ? "New dish — details" : "New dish — photos"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {editing
                  ? "Changes go live as soon as you save."
                  : step === 1
                    ? "Step 1 of 2 — name, price and description."
                    : "Step 2 of 2 — add photos and pick the main one."}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={closeForm} aria-label="Close form">
              <X />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-5">
              <section className={`grid gap-4 sm:grid-cols-2 ${!editing && step !== 1 ? "hidden" : ""}`}>
                <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Details
                </p>
              <div className="grid gap-1.5">
                <Label htmlFor="mi-name">Name *</Label>
                <Input id="mi-name" required value={form.name} onChange={set("name")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mi-price">Price ($) *</Label>
                <Input id="mi-price" required inputMode="decimal" value={form.price} onChange={set("price")} />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="mi-desc">Description *</Label>
                <Textarea id="mi-desc" required value={form.description} onChange={set("description")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mi-tag">Tag</Label>
                <Select id="mi-tag" className="h-9" value={form.tag} onChange={set("tag")}>
                  <option value="sweet">Sweet</option>
                  <option value="savoury">Savoury</option>
                  <option value="choc">Choc Loaded</option>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mi-heat">Heat badge</Label>
                <Select id="mi-heat" className="h-9" value={form.heat} onChange={set("heat")}>
                  <option value="none">None</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                </Select>
              </div>
              </section>

              <section className={`grid gap-4 sm:grid-cols-3 ${!editing && step !== 1 ? "hidden" : ""}`}>
                <p className="sm:col-span-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nutrition &amp; timing <span className="font-normal normal-case tracking-normal">(optional)</span>
                </p>
              <div className="grid gap-1.5">
                <Label htmlFor="mi-kcal">kcal</Label>
                <Input id="mi-kcal" inputMode="numeric" value={form.kcal} onChange={set("kcal")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mi-protein">Protein (g)</Label>
                <Input id="mi-protein" inputMode="numeric" value={form.protein_g} onChange={set("protein_g")} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mi-prep">Prep time</Label>
                <Input id="mi-prep" placeholder="12–14 min" value={form.prep_time} onChange={set("prep_time")} />
              </div>
              </section>

              <section className={`grid gap-4 ${!editing && step !== 2 ? "hidden" : ""}`}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Images</p>
                  <p className="text-xs text-muted-foreground">
                    Upload everything here, then mark one as <span className="font-medium">Main</span> —
                    that is what customers see on cards and at the top of the dish page. A
                    <span className="font-medium"> Cutout</span> is optional: it is the background-free
                    version used on tiles.
                  </p>
                </div>

                <div ref={photosRef}>
                  <PhotoBoard
                    slug={editing ?? ""}
                    name={form.name || "this dish"}
                    mainUrl={form.photo}
                    cutoutUrl={form.image}
                    onSetMain={(url) => setForm((f) => ({ ...f, photo: url }))}
                    onSetCutout={(url) => setForm((f) => ({ ...f, image: url }))}
                    onCountChange={(slug, count) => setPhotoCounts((c) => ({ ...c, [slug]: count }))}
                    pending={pendingPhotos}
                    onPendingChange={setPendingPhotos}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {editing
                    ? "Main image and cutout are saved with Save changes; uploads and deletions save instantly."
                    : "Upload now if you like — the photos attach to the dish when you press Add to menu."}
                </p>
              </section>

              <section className={`grid gap-4 ${!editing && step !== 2 ? "hidden" : ""}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Availability</p>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Switch
                      checked={form.is_available}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, is_available: v }))}
                    />
                    Available
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Switch
                      checked={form.is_featured}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, is_featured: v }))}
                    />
                    Featured on home page
                  </label>
                </div>
              </section>

              {/* always reachable: this form is taller than most screens */}
              <div className="sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t bg-background/95 px-6 py-3 backdrop-blur">
                <span className="text-xs text-muted-foreground">
                  {!editing && `Step ${step} of 2`}
                </span>
                <div className="flex items-center gap-3">
                  {!editing && step === 2 && (
                    <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                  )}
                  <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
                  {/* one button that never swaps type mid-click: swapping it
                      let the click land on a freshly mounted submit button */}
                  <Button
                    type="button"
                    loading={saving}
                    onClick={() => (!editing && step === 1 ? goToPhotos() : submit())}
                  >
                    {!editing && step === 1 ? "Next: photos →" : editing ? "Save changes" : "Add to menu"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <TableSkeleton rows={6} cols={7} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.slug}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(item, true)}
                          aria-label={`Photos for ${item.name}`}
                          className="rounded-md transition-transform hover:scale-105"
                        >
                          {/* a dish may legitimately have no image yet — never
                              hand next/image an empty src */}
                          {item.photo || item.image ? (
                            <Image
                              src={item.photo || item.image}
                              alt=""
                              width={80}
                              height={80}
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <span className="grid h-10 w-10 place-items-center rounded-md border border-dashed text-[10px] text-muted-foreground">
                              add
                            </span>
                          )}
                        </button>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="max-w-72 truncate text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{TAG_LABEL[item.tag]}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">${item.price}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item, true)}
                        aria-label={`Manage photos for ${item.name}`}
                      >
                        <ImageIcon />
                        {photoCounts[item.slug] ? `${photoCounts[item.slug]} photos` : "Add"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={(v) =>
                          toggle(
                            item,
                            { is_available: v },
                            v ? `${item.name} is available again` : `${item.name} hidden from the menu`
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.is_featured}
                        onCheckedChange={(v) =>
                          toggle(
                            item,
                            { is_featured: v },
                            v ? `${item.name} featured on the home page` : `${item.name} unfeatured`
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}>
                          <Pencil /> Edit
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(item)} aria-label={`Delete ${item.name}`}>
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No menu items yet. Click &ldquo;Add item&rdquo; to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
