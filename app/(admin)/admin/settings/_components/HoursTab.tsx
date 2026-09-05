import type { Dispatch, SetStateAction } from "react";
import { Clock, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm";
import { createHours, deleteHours, updateHours, type AdminHours } from "@/lib/admin-api";
import { EMPTY_ROW, formatTime12h, type HoursRow, type RunSave } from "../_lib";

// Settings · Hours tab: editable trading-hours rows + add-new-row form.
export function HoursTab({
  hours,
  setHours,
  newRow,
  setNewRow,
  busy,
  run,
}: {
  hours: AdminHours[];
  setHours: Dispatch<SetStateAction<AdminHours[]>>;
  newRow: HoursRow;
  setNewRow: Dispatch<SetStateAction<HoursRow>>;
  busy: string;
  run: RunSave;
}) {
  const { confirm: confirmDialog } = useConfirm();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#763a12]" />
            <h3 className="text-base font-semibold text-[#211a14]">Restaurant Trading Hours</h3>
          </div>
          <p className="text-xs text-zinc-500">
            Opening and closing schedule displayed on the homepage, booking calendar, and footer board
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {hours.map((h, idx) => (
          <div
            key={h.id}
            className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-lg border border-zinc-200 bg-white shadow-2xs hover:border-zinc-300 transition-all"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
              <span className="h-7 w-7 rounded-xl bg-zinc-100 text-[#763a12] text-xs font-semibold flex items-center justify-center shrink-0">
                #{idx + 1}
              </span>
              <Input
                className="h-10 text-xs font-bold border-zinc-300 rounded-xl text-[#211a14]"
                placeholder="e.g. Monday – Thursday"
                value={h.label}
                onChange={(e) =>
                  setHours((xs) =>
                    xs.map((x) => (x.id === h.id ? { ...x, label: e.target.value } : x))
                  )
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="time"
                className="w-24 sm:w-28 h-10 text-xs font-bold border-zinc-300 rounded-xl text-center"
                value={h.opens.slice(0, 5)}
                onChange={(e) =>
                  setHours((xs) =>
                    xs.map((x) => (x.id === h.id ? { ...x, opens: e.target.value } : x))
                  )
                }
              />
              <span className="text-zinc-400 text-xs font-semibold">TO</span>
              <Input
                type="time"
                className="w-24 sm:w-28 h-10 text-xs font-bold border-zinc-300 rounded-xl text-center"
                value={h.closes.slice(0, 5)}
                onChange={(e) =>
                  setHours((xs) =>
                    xs.map((x) => (x.id === h.id ? { ...x, closes: e.target.value } : x))
                  )
                }
              />

              {/* Formatted AM/PM Badge */}
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-white border border-zinc-200 text-[11px] font-bold text-amber-900 shrink-0">
                {formatTime12h(h.opens)} – {formatTime12h(h.closes)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                className="h-10 px-3.5 bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
                onClick={() =>
                  run(
                    async () => {
                      await updateHours(h.id, {
                        label: h.label,
                        opens: h.opens,
                        closes: h.closes,
                      });
                    },
                    "Hours",
                    { title: `Schedule updated for ${h.label}` }
                  )
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
                    title: `Delete schedule for “${h.label || "this day"}”?`,
                    description: "This schedule row will be removed from the public website.",
                    confirmLabel: "Delete schedule row",
                    destructive: true,
                  });
                  if (!ok) return;
                  run(async () => {
                    await deleteHours(h.id);
                    setHours((xs) => xs.filter((x) => x.id !== h.id));
                  }, "Hours", { title: "Schedule row deleted" });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Add New Schedule Row Box */}
        <div className="p-5 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 space-y-3">
          <span className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-[#763a12]" /> Add New Trading Schedule Row:
          </span>
          <div className="grid gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <Input
                className="h-10 text-xs font-bold border-zinc-300 bg-white rounded-xl"
                placeholder="Day label (e.g. Friday – Sunday or Public Holidays)"
                value={newRow.label}
                onChange={(e) => setNewRow((n) => ({ ...n, label: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-4 flex items-center gap-2">
              <Input
                type="time"
                className="w-full h-10 text-xs font-bold border-zinc-300 bg-white rounded-xl text-center"
                value={newRow.opens}
                onChange={(e) => setNewRow((n) => ({ ...n, opens: e.target.value }))}
              />
              <span className="text-zinc-400 text-xs font-bold">–</span>
              <Input
                type="time"
                className="w-full h-10 text-xs font-bold border-zinc-300 bg-white rounded-xl text-center"
                value={newRow.closes}
                onChange={(e) => setNewRow((n) => ({ ...n, closes: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-3">
              <Button
                size="sm"
                className="w-full h-10 bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
                disabled={!newRow.label.trim()}
                loading={busy === "Hours"}
                onClick={() =>
                  run(async () => {
                    const created = await createHours({
                      ...newRow,
                      sort_order: hours.length,
                    });
                    setHours((xs) => [...xs, created]);
                    setNewRow(EMPTY_ROW);
                  }, "Hours", { title: "Row added" })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
