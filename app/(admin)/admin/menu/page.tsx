"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createMenuItem,
  deleteMenuItem,
  listMenu,
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
import { UploadButton } from "@/components/ui/upload-button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

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
  is_available: true,
  is_featured: false,
};

type FormState = typeof EMPTY_FORM;

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function MenuAdminPage() {
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [error, setError] = useState("");
  // null = form closed, "" = adding new, slug = editing that item
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    listMenu()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  useEffect(load, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditing("");
    setError("");
  };

  const openEdit = (item: AdminMenuItem) => {
    setForm({
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
      is_available: item.is_available,
      is_featured: item.is_featured,
    });
    setEditing(item.slug);
    setError("");
  };

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      is_available: form.is_available,
      is_featured: form.is_featured,
    };
    try {
      if (editing) await updateMenuItem(editing, payload);
      else await createMenuItem(payload);
      toast({
        variant: "success",
        title: editing ? `${form.name} updated` : `${form.name} added to the menu`,
      });
      setEditing(null);
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

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      {editing !== null && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editing ? `Edit: ${form.name}` : "New menu item"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setEditing(null)} aria-label="Close form">
              <X />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
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
              <div className="grid gap-1.5">
                <Label htmlFor="mi-image">Image</Label>
                <div className="flex items-center gap-2">
                  <Input id="mi-image" placeholder="/menu/waffle.png" value={form.image} onChange={set("image")} />
                  <UploadButton cutout onUploaded={(url) => setForm((f) => ({ ...f, image: url }))} />
                </div>
              </div>
              <div className="flex items-center gap-6 sm:col-span-2">
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
              <div className="sm:col-span-2">
                <Button type="submit" loading={saving}>
                  {editing ? "Save changes" : "Add to menu"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Price</TableHead>
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
                      <Image src={item.image} alt="" width={80} height={80} className="h-10 w-10 rounded-md object-contain" />
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
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(item)} aria-label={`Delete ${item.name}`}>
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
