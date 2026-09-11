import type { Metadata } from "next";
import MenuClient from "@/components/MenuClient";
import { getCampaigns, getMenuWithStatus, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu & Special Deals",
  description:
    "Signature pancake stacks — fluffy, fresh, and griddled to order. Explore our full menu and daily special offers.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const [{ items, live }, site, campaigns] = await Promise.all([
    getMenuWithStatus(),
    getSite(),
    getCampaigns(),
  ]);

  return (
    <>
      <section className="menu-hero">
        <div className="container">
          <h1>
            {site.menu_hero_heading || "Stacks On"}{" "}
            <span className="accent">{site.menu_hero_script || "Stacks."}</span>
          </h1>
          <p>{site.menu_hero_lead || "Signature pancake stacks. Griddled to order. Zero regrets."}</p>
        </div>
      </section>

      <MenuClient
        items={items}
        campaigns={campaigns}
        live={live && site.online_ordering_enabled}
        phone={site.phone}
        pauseMessage={site.online_ordering_disabled_message}
        uberEatsUrl={site.uber_eats_url}
      />
    </>
  );
}
