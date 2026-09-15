import type { Metadata } from "next";
import MenuClient from "@/components/MenuClient";
import { getAnnouncement, getCampaigns, getCategories, getMenuWithStatus, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu & Special Deals",
  description:
    "Signature pancake stacks — fluffy, fresh, and griddled to order. Explore our full menu and daily special offers.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const [announcement, { items, live }, site, campaigns, categories] = await Promise.all([
    getAnnouncement(),
    getMenuWithStatus(),
    getSite(),
    getCampaigns(),
    getCategories(),
  ]);

  // Ensure active announcement offer is present in the deals list for full consistency
  const allCampaigns = [...campaigns];
  if (announcement && !allCampaigns.some((c) => c.message === announcement.message)) {
    allCampaigns.unshift(announcement);
  }

  return (
    <>
      <section className="menu-hero">
        <div className="container">
          <h1>
            {site.menu_hero_heading || "Pick your"}{" "}
            <span className="accent">{site.menu_hero_script || "Favourites"}</span>
          </h1>
          <p>{site.menu_hero_lead || "Freshly made and served with love"}</p>
        </div>
      </section>

      <MenuClient
        items={items}
        categories={categories}
        campaigns={allCampaigns}
        live={live && site.online_ordering_enabled}
        phone={site.phone}
        pauseMessage={site.online_ordering_disabled_message}
        uberEatsUrl={site.uber_eats_url}
      />
    </>
  );
}
