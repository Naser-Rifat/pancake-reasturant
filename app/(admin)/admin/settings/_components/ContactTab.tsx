import { Building2, MapPin, Phone, Save, Share2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateSiteSettings, type AdminSiteSettings } from "@/lib/admin-api";
import { AU_TIMEZONES, type RunSave, type SetSiteField } from "../_lib";
import { FacebookIcon, InstagramIcon } from "./SocialIcons";

// Settings · Contact tab: business/legal details, socials, and the maps embed.
export function ContactTab({
  site,
  setS,
  busy,
  run,
}: {
  site: AdminSiteSettings;
  setS: SetSiteField;
  busy: string;
  run: RunSave;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        {/* Card Header with Save Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#763a12]" />
              <h3 className="text-base font-semibold text-[#211a14]">Business &amp; Contact Details</h3>
            </div>
            <p className="text-xs text-zinc-500">
              Displayed on the website footer, receipts, location card, and confirmation emails
            </p>
          </div>
          <Button
            size="sm"
            className="bg-[#763a12] hover:bg-[#5e2d0d] text-white font-bold text-xs rounded-xl shadow-xs"
            loading={busy === "Settings"}
            onClick={() =>
              run(async () => {
                await updateSiteSettings({
                  address: site.address,
                  phone: site.phone,
                  whatsapp: site.whatsapp,
                  email: site.email,
                  abn: site.abn,
                  timezone: site.timezone,
                  map_embed: site.map_embed,
                  instagram_url: site.instagram_url,
                  facebook_url: site.facebook_url,
                  uber_eats_url: site.uber_eats_url,
                });
              }, "Settings", { title: "Contact info saved" })
            }
          >
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Contact Info
          </Button>
        </div>

        {/* SECTION A: Core Contact & Legal Details */}
        <div className="space-y-4">
          <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> Primary Contact &amp; Legal Info:
          </span>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="s-address" className="text-xs font-semibold text-[#211a14]">
                Street Address (Display on Footer &amp; Booking)
              </Label>
              <Input
                id="s-address"
                className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                placeholder="e.g. 123 Pancake Lane, Sydney NSW 2000"
                value={site.address}
                onChange={setS("address")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-phone" className="text-xs font-semibold text-[#211a14]">
                Direct Phone Number
              </Label>
              <Input
                id="s-phone"
                className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                placeholder="e.g. (02) 9876 5432"
                value={site.phone}
                onChange={setS("phone")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-wa" className="text-xs font-semibold text-[#211a14]">
                WhatsApp Direct Order (Optional)
              </Label>
              <Input
                id="s-wa"
                className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                placeholder="+61 4xx xxx xxx"
                value={site.whatsapp}
                onChange={setS("whatsapp")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-email" className="text-xs font-semibold text-[#211a14]">
                Public Inquiries &amp; Alert Email
              </Label>
              <Input
                id="s-email"
                type="email"
                className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                placeholder="orders@pancakediner.com.au"
                value={site.email}
                onChange={setS("email")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="s-abn" className="text-xs font-semibold text-[#211a14]">
                ABN (Australian Business Number)
              </Label>
              <Input
                id="s-abn"
                className="border-zinc-300 text-[#211a14] font-bold text-sm h-10 rounded-xl"
                placeholder="e.g. 12 345 678 901"
                value={site.abn}
                onChange={setS("abn")}
              />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="s-tz" className="text-xs font-semibold text-[#211a14]">
                Venue Operating Timezone
              </Label>
              <Select
                id="s-tz"
                className="h-10 text-xs border-zinc-300 font-bold rounded-xl"
                value={site.timezone}
                onChange={setS("timezone")}
              >
                {AU_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* SECTION B: Social & Delivery Platform Integrations */}
        <div className="pt-4 border-t border-zinc-200 space-y-4">
          <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Social Media &amp; Online Delivery Links:
          </span>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg border border-zinc-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-[#763a12]">
                <InstagramIcon className="h-4 w-4 text-pink-600" />
                <Label htmlFor="s-insta" className="text-xs font-semibold text-[#211a14]">
                  Instagram Page
                </Label>
              </div>
              <Input
                id="s-insta"
                className="border-zinc-300 bg-white text-[#211a14] font-medium text-xs h-9 rounded-xl"
                placeholder="https://instagram.com/pancakediner"
                value={site.instagram_url}
                onChange={setS("instagram_url")}
              />
            </div>

            <div className="p-4 rounded-lg border border-zinc-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-[#763a12]">
                <FacebookIcon className="h-4 w-4 text-blue-600" />
                <Label htmlFor="s-fb" className="text-xs font-semibold text-[#211a14]">
                  Facebook Page
                </Label>
              </div>
              <Input
                id="s-fb"
                className="border-zinc-300 bg-white text-[#211a14] font-medium text-xs h-9 rounded-xl"
                placeholder="https://facebook.com/pancakediner"
                value={site.facebook_url}
                onChange={setS("facebook_url")}
              />
            </div>

            <div className="p-4 rounded-lg border border-zinc-200 bg-white space-y-2">
              <div className="flex items-center gap-2 text-[#763a12]">
                <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
                <Label htmlFor="s-uber" className="text-xs font-semibold text-[#211a14]">
                  Uber Eats Store Link
                </Label>
              </div>
              <Input
                id="s-uber"
                className="border-zinc-300 bg-white text-[#211a14] font-medium text-xs h-9 rounded-xl"
                placeholder="https://www.ubereats.com/store/..."
                value={site.uber_eats_url}
                onChange={setS("uber_eats_url")}
              />
            </div>
          </div>
        </div>

        {/* SECTION C: Google Maps Embed URL */}
        <div className="pt-4 border-t border-zinc-200 space-y-3">
          <span className="text-xs font-semibold text-[#763a12] uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Interactive Location Map (Google Maps Embed):
          </span>
          <div className="space-y-1">
            <Label htmlFor="s-map" className="text-xs font-semibold text-[#211a14]">
              Google Maps Embed iFrame Source URL (src=&quot;...&quot;)
            </Label>
            <Input
              id="s-map"
              className="border-zinc-300 text-[#211a14] font-mono text-xs h-10 rounded-xl"
              placeholder="https://www.google.com/maps/embed?pb=..."
              value={site.map_embed}
              onChange={setS("map_embed")}
            />
            <p className="text-[10px] text-zinc-500">
              Tip: On Google Maps, click Share → Embed a map → Copy HTML and paste the URL from <code>src=&quot;...&quot;</code> here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
