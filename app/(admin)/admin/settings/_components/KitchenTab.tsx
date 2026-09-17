"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Clock, Mail, Send } from "lucide-react";
import { SaveButton } from "@/components/admin/SaveButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { sendTestEmail, updateSiteSettings, type AdminSiteSettings } from "@/lib/admin-api";
import type { RunSave } from "../_lib";

// Settings · Kitchen tab: online-ordering master toggle, pause notice, email test.
export function KitchenTab({
  site,
  setSite,
  busy,
  run,
}: {
  site: AdminSiteSettings;
  setSite: Dispatch<SetStateAction<AdminSiteSettings | null>>;
  busy: string;
  run: RunSave;
}) {
  const { toast } = useToast();
  const testEmail = useMutation({
    mutationFn: async () => {
      const response = await sendTestEmail(site.email);
      if (!response.ok) throw new Error(response.detail);
      return response;
    },
    onSuccess: (res) => {
      toast({
        variant: res.detail.includes("NOT") ? "info" : "success",
        title: res.detail.includes("NOT")
          ? "Email not configured yet"
          : `Test email dispatched to ${res.to}`,
        description: res.detail,
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: "Test email failed",
        description: error instanceof Error ? error.message : undefined,
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Main Hero Card for Ordering Status */}
      <div
        className={`p-6 sm:p-8 rounded-xl border transition-all shadow-sm space-y-6 ${
          site.online_ordering_enabled
            ? "bg-white border-emerald-300"
            : "bg-white border-amber-300"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  site.online_ordering_enabled
                    ? "bg-emerald-500 ring-4 ring-emerald-200"
                    : "bg-amber-500 ring-4 ring-amber-200"
                }`}
              />
              <h3 className="text-base font-semibold text-[#211a14]">
                {site.online_ordering_enabled
                  ? "Online ordering is on"
                  : "Online ordering is paused"}
              </h3>
            </div>
            <p className="text-xs text-zinc-600 max-w-xl">
              {site.online_ordering_enabled
                ? "Customers can add items to cart and complete checkout on the menu page. Flip the switch to pause checkout during peak kitchen rushes."
                : "Customers can view the menu, but checkout is paused. A friendly notice directs them to call the diner or order on Uber Eats."}
            </p>
          </div>

          {/* Big High-Visibility Master Toggle */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-200 bg-white shadow-xs shrink-0">
            <Switch
              checked={site.online_ordering_enabled}
              disabled={busy === "OrderingToggle"}
              onCheckedChange={(v) => {
                setSite((s) => (s ? { ...s, online_ordering_enabled: v } : s));
                run(
                  async () => {
                    try {
                      await updateSiteSettings({ online_ordering_enabled: v });
                    } catch (e) {
                      // roll the optimistic flip back so the UI never lies
                      setSite((s) => (s ? { ...s, online_ordering_enabled: !v } : s));
                      throw e;
                    }
                  },
                  "OrderingToggle",
                  {
                    title: v ? "Online ordering ENABLED" : "Online ordering PAUSED",
                    description: v
                      ? "Customers can now order takeaway from the website"
                      : "Checkout is now paused on the website",
                  }
                );
              }}
            />
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-xl uppercase tracking-wide ${
                site.online_ordering_enabled
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-amber-600 text-white shadow-xs"
              }`}
            >
              {site.online_ordering_enabled ? "ACTIVE" : "PAUSED"}
            </span>
          </div>
        </div>

        {/* Custom Pause Notice Message */}
        {!site.online_ordering_enabled && (
          <div className="p-5 rounded-lg border border-amber-300 bg-amber-50/70 space-y-3">
            <div className="flex items-center gap-2 text-amber-950 font-semibold text-xs">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Custom Message Displayed to Visitors on the Menu Page:</span>
            </div>
            <Textarea
              id="pause-msg"
              rows={2}
              className="bg-white border-amber-300 text-xs font-bold text-[#211a14] rounded-xl"
              placeholder="e.g. Our kitchen is currently busy with dine-in service! Please call us or order through Uber Eats."
              value={site.online_ordering_disabled_message}
              onChange={(e) =>
                setSite((s) => (s ? { ...s, online_ordering_disabled_message: e.target.value } : s))
              }
            />
            <SaveButton
              loading={busy === "PauseMessage"}
              onClick={() =>
                run(
                  async () => {
                    await updateSiteSettings({
                      online_ordering_disabled_message: site.online_ordering_disabled_message,
                    });
                  },
                  "PauseMessage",
                  { title: "Pause notice saved" }
                )
              }
            >
              Save Pause Message
            </SaveButton>
          </div>
        )}
      </div>

      {/* Kitchen Preparation & Pickup Lead Time Card */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-zinc-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="text-base font-semibold text-[#211a14]">
                Kitchen Preparation & Pickup Time
              </h3>
              <p className="text-xs text-zinc-500">
                Shown to customers in the Cart Drawer before ordering and on the Order Confirmation page.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto">
            ⏱️ {site.order_prep_time || "15–20 mins"}
          </span>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Quick Traffic Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: "⚡ Fast", value: "10–15 mins", sub: "Quiet / Low Traffic" },
              { label: "🥞 Standard", value: "15–20 mins", sub: "Normal Service" },
              { label: "🔥 Busy", value: "20–30 mins", sub: "Peak Lunch / Evening" },
              { label: "🚨 Rush Hour", value: "30–45 mins", sub: "Heavy Weekend Rush" },
            ].map((preset) => {
              const active = (site.order_prep_time || "15–20 mins") === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setSite((s) => (s ? { ...s, order_prep_time: preset.value } : s));
                    run(
                      async () => {
                        await updateSiteSettings({ order_prep_time: preset.value });
                      },
                      "PrepTimePreset",
                      {
                        title: `Wait time set to ${preset.value}`,
                        description: `Customers will now see "${preset.value}" estimated pickup time.`,
                      }
                    );
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/40 shadow-xs"
                      : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/60"
                  }`}
                >
                  <div className="text-xs font-bold text-zinc-900">{preset.label}</div>
                  <div className="text-sm font-extrabold text-amber-900 mt-0.5">{preset.value}</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{preset.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              className="w-full h-10 px-3.5 text-xs font-medium text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
              placeholder="Or enter custom time (e.g. 20–25 mins)"
              value={site.order_prep_time || ""}
              onChange={(e) =>
                setSite((s) => (s ? { ...s, order_prep_time: e.target.value } : s))
              }
            />
          </div>
          <SaveButton
            loading={busy === "PrepTimeCustom"}
            onClick={() =>
              run(
                async () => {
                  await updateSiteSettings({
                    order_prep_time: site.order_prep_time || "15–20 mins",
                  });
                },
                "PrepTimeCustom",
                { title: "Prep time updated", description: `Set to "${site.order_prep_time || "15–20 mins"}"` }
              )
            }
          >
            Save Custom Time
          </SaveButton>
        </div>
      </div>

      {/* Email Diagnostics Card */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="text-sm font-semibold text-[#211a14]">Email delivery</h4>
              <p className="text-xs text-zinc-500">
                Send a test email to check that confirmations and staff alerts are being delivered
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-zinc-200 bg-white">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-[#211a14]">Send a test email</p>
            <p className="text-xs text-zinc-600">
              Sends a test message to <strong>{site.email || "the configured staff inbox"}</strong>
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="font-bold text-xs border-zinc-300 text-[#763a12] bg-white hover:bg-zinc-50 rounded-xl shrink-0"
            loading={testEmail.isPending}
            disabled={testEmail.isPending}
            onClick={() => testEmail.mutate()}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" /> Send Test Email
          </Button>
        </div>
      </div>
    </div>
  );
}
