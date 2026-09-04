import type { Dispatch, SetStateAction } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UploadButton } from "@/components/ui/upload-button";
import { useConfirm } from "@/components/ui/confirm";
import { CERT_ICONS } from "@/components/CertIcon";
import {
  createCertification,
  deleteCertification,
  updateCertification,
  type AdminCertification,
} from "@/lib/admin-api";
import { EMPTY_CERT, type NewCert, type RunSave } from "../_lib";

// Home studio · Step 4: the homepage trust badges / certifications strip.
export function HomeStep4Badges({
  certs,
  setCerts,
  newCert,
  setNewCert,
  run,
  setHomeStepIndex,
}: {
  certs: AdminCertification[];
  setCerts: Dispatch<SetStateAction<AdminCertification[]>>;
  newCert: NewCert;
  setNewCert: Dispatch<SetStateAction<NewCert>>;
  run: RunSave;
  setHomeStepIndex: Dispatch<SetStateAction<number>>;
}) {
  const { confirm: confirmDialog } = useConfirm();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#763a12] text-white uppercase tracking-wide">
            Section 4
          </span>
          <div>
            <h3 className="text-base font-semibold text-[#211a14]">Homepage Trust Badges &amp; Certifications</h3>
            <p className="text-xs text-zinc-500">Quality seals, halal/organic stamps, and accreditation awards</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3.5">
        {certs.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs"
          >
            {/* real logo beats the built-in icon */}
            {c.image ? (
              <div className="flex items-center gap-1.5">
                <div className="relative h-10 w-10 rounded-lg border bg-white overflow-hidden shrink-0">
                  <Image src={c.image} alt={c.title} fill sizes="40px" className="object-contain p-0.5" />
                </div>
                <button
                  type="button"
                  title="Remove logo — go back to the built-in icon"
                  className="p-1.5 text-zinc-400 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  onClick={() =>
                    run(async () => {
                      await updateCertification(c.id, { image: "" });
                      setCerts((xs) => xs.map((x) => (x.id === c.id ? { ...x, image: "" } : x)));
                    }, "Certification", { title: "Logo removed — showing the built-in icon" })
                  }
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Select
                className="h-10 w-36 text-xs border-zinc-300 font-bold rounded-xl"
                value={c.icon}
                onChange={(e) =>
                  setCerts((xs) =>
                    xs.map((x) => (x.id === c.id ? { ...x, icon: e.target.value } : x))
                  )
                }
              >
                {!CERT_ICONS.includes(c.icon) && <option value={c.icon}>Custom: {c.icon}</option>}
                {CERT_ICONS.map((ic) => (
                  <option key={ic} value={ic} className="capitalize">
                    {ic}
                  </option>
                ))}
              </Select>
            )}
            <UploadButton
              label={c.image ? "Change Logo" : "Real Logo"}
              onUploaded={(url) =>
                run(async () => {
                  await updateCertification(c.id, { image: url });
                  setCerts((xs) => xs.map((x) => (x.id === c.id ? { ...x, image: url } : x)));
                }, "Certification", { title: "Logo uploaded" })
              }
            />
            <Input
              className="min-w-44 flex-1 h-10 text-xs border-zinc-300 text-[#211a14] font-semibold rounded-xl"
              placeholder="Badge Name (e.g. 100% Pure Canadian Maple)"
              value={c.title}
              onChange={(e) =>
                setCerts((xs) =>
                  xs.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x))
                )
              }
            />
            <Input
              className="min-w-44 flex-1 h-10 text-xs border-zinc-300 text-[#211a14] font-medium rounded-xl"
              placeholder="Subtitle (Optional)"
              value={c.subtitle}
              onChange={(e) =>
                setCerts((xs) =>
                  xs.map((x) => (x.id === c.id ? { ...x, subtitle: e.target.value } : x))
                )
              }
            />
            <label className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-zinc-100 rounded-xl border border-zinc-200 cursor-pointer">
              <Switch
                checked={c.is_active}
                onCheckedChange={(v) =>
                  run(async () => {
                    await updateCertification(c.id, { is_active: v });
                    setCerts((xs) =>
                      xs.map((x) => (x.id === c.id ? { ...x, is_active: v } : x))
                    );
                  }, "Certification", { title: v ? "Badge shown" : "Badge hidden" })
                }
              />
              <span className="text-[#763a12]">{c.is_active ? "Shown" : "Hidden"}</span>
            </label>
            <Button
              size="sm"
              className="h-10 px-4 text-xs font-bold bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
              onClick={() =>
                run(async () => {
                  await updateCertification(c.id, {
                    icon: c.icon,
                    title: c.title,
                    subtitle: c.subtitle,
                  });
                }, "Certification", { title: "Badge updated" })
              }
            >
              <Save className="h-3.5 w-3.5 mr-1" /> Save
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"
              onClick={async () => {
                const ok = await confirmDialog({
                  title: `Delete “${c.title}”?`,
                  description: "The badge disappears from the homepage trust strip.",
                  confirmLabel: "Delete badge",
                  destructive: true,
                });
                if (!ok) return;
                run(async () => {
                  await deleteCertification(c.id);
                  setCerts((xs) => xs.filter((x) => x.id !== c.id));
                }, "Certification", { title: "Badge deleted" });
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Add New Badge */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-dashed border-zinc-300 bg-white">
          <span className="text-xs font-semibold text-[#211a14] flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-[#763a12]" /> Add New Badge:
          </span>
          {newCert.image ? (
            <div className="flex items-center gap-1.5">
              <div className="relative h-10 w-10 rounded-lg border bg-white overflow-hidden shrink-0">
                <Image src={newCert.image} alt="New badge logo" fill sizes="40px" className="object-contain p-0.5" />
              </div>
              <button
                type="button"
                title="Remove logo"
                className="p-1.5 text-zinc-400 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                onClick={() => setNewCert((n) => ({ ...n, image: "" }))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Select
              className="h-10 w-36 text-xs border-zinc-300 font-bold rounded-xl"
              value={newCert.icon}
              onChange={(e) => setNewCert((n) => ({ ...n, icon: e.target.value }))}
            >
              {CERT_ICONS.map((ic) => (
                <option key={ic} value={ic} className="capitalize">
                  {ic}
                </option>
              ))}
            </Select>
          )}
          <UploadButton
            label="Real Logo"
            onUploaded={(url) => setNewCert((n) => ({ ...n, image: url }))}
          />
          <Input
            className="min-w-44 flex-1 h-10 text-xs border-zinc-300 text-[#211a14] font-bold rounded-xl"
            placeholder="Badge Name (e.g. Free Range Eggs)"
            value={newCert.title}
            onChange={(e) => setNewCert((n) => ({ ...n, title: e.target.value }))}
          />
          <Input
            className="min-w-44 flex-1 h-10 text-xs border-zinc-300 text-[#211a14] font-medium rounded-xl"
            placeholder="Subtitle (Optional)"
            value={newCert.subtitle}
            onChange={(e) => setNewCert((n) => ({ ...n, subtitle: e.target.value }))}
          />
          <Button
            size="sm"
            className="h-10 text-xs font-bold bg-[#763a12] hover:bg-[#5e2d0d] text-white rounded-xl"
            disabled={!newCert.title.trim()}
            onClick={() =>
              run(async () => {
                const created = await createCertification({
                  ...newCert,
                  sort_order: certs.length,
                });
                setCerts((xs) => [...xs, created]);
                setNewCert(EMPTY_CERT);
              }, "Certification", { title: "Badge added" })
            }
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Badge
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200">
        <Button
          type="button"
          variant="outline"
          className="gap-2 text-xs font-bold border-zinc-300 text-[#763a12] rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(3)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Previous: Step 3 (Photos)</span>
        </Button>
        <Button
          type="button"
          className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs gap-2 rounded-xl whitespace-normal h-auto"
          onClick={() => setHomeStepIndex(5)}
        >
          <span>Next: Step 5 (Bottom Banner)</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
