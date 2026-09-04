import type { Dispatch, SetStateAction } from "react";
import { AlertCircle, Mail, Save, Send } from "lucide-react";
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
  setBusy,
  run,
}: {
  site: AdminSiteSettings;
  setSite: Dispatch<SetStateAction<AdminSiteSettings | null>>;
  busy: string;
  setBusy: Dispatch<SetStateAction<string>>;
  run: RunSave;
}) {
  const { toast } = useToast();

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
            <Button
              size="sm"
              className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl"
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
              <Save className="h-3.5 w-3.5 mr-1" /> Save Pause Message
            </Button>
          </div>
        )}
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
            loading={busy === "TestEmail"}
            onClick={async () => {
              setBusy("TestEmail");
              try {
                const res = await sendTestEmail();
                if (!res.ok) throw new Error(res.detail);
                toast({
                  variant: res.detail.includes("NOT") ? "info" : "success",
                  title: res.detail.includes("NOT")
                    ? "Email not configured yet"
                    : `Test email dispatched to ${res.to}`,
                  description: res.detail,
                });
              } catch (e) {
                toast({
                  variant: "error",
                  title: "Test email failed",
                  description: e instanceof Error ? e.message : undefined,
                });
              } finally {
                setBusy("");
              }
            }}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" /> Send Test Email
          </Button>
        </div>
      </div>
    </div>
  );
}
