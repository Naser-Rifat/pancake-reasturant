import type { Metadata } from "next";
import MenuClient from "@/components/MenuClient";
import { getHomeSteps, getMenuWithStatus, getSite } from "@/lib/api";
import {
  OrderOnlineSticker,
  GriddleFreshSticker,
  PickUpHotSticker,
} from "@/components/icons/StepStickers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "Six signature pancake stacks — fluffy, fresh, and griddled to order. See the menu and book a table.",
  alternates: { canonical: "/menu" },
};

const STICKERS = [OrderOnlineSticker, GriddleFreshSticker, PickUpHotSticker];

export default async function MenuPage() {
  const [{ items, live }, site, steps] = await Promise.all([
    getMenuWithStatus(),
    getSite(),
    getHomeSteps(),
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

      {/* 3 Step Visual Process Sticker Cards (Option 2) */}
      {steps.length > 0 && (
        <section className="pickup-steps-section">
          <div className="container">
            <div className="pickup-steps-grid">
              {steps.map((st, i) => {
                const stepNum = `0${i + 1}`;
                const StickerComp = STICKERS[i % STICKERS.length];

                return (
                  <article className="pickup-step-card" key={st.id}>
                    <div className="ps-icon-badge-wrap">
                      <div className="ps-sticker-bubble">
                        <StickerComp />
                      </div>
                      <span className="ps-step-pill">STEP {stepNum}</span>
                    </div>
                    <div className="ps-content">
                      <h3 className="ps-title">{st.title}</h3>
                      <p className="ps-desc">{st.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
      <MenuClient
        items={items}
        live={live && site.online_ordering_enabled}
        phone={site.phone}
        pauseMessage={site.online_ordering_disabled_message}
        uberEatsUrl={site.uber_eats_url}
      />
    </>
  );
}
