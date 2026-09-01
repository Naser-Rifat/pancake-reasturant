import type { Metadata } from "next";
import MenuClient from "@/components/MenuClient";
import { getHomeSteps, getMenuWithStatus, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu | The Pancake Club",
  description:
    "Six signature pancake stacks — fluffy, fresh, and griddled to order. See the menu and book a table.",
};

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
          <p className="kicker">The Lineup</p>
          <h1>Stacks On <span className="accent">Stacks.</span></h1>
          <p>Signature pancake stacks. Griddled to order. Zero regrets.</p>
        </div>
      </section>
      {/* Moved off the home page: these three answers matter at the moment
          someone is actually choosing a stack, not before they've picked one. */}
      {steps.length > 0 && (
        <div className="container">
          <ol className="pickup-steps">
            {steps.map((st, i) => (
              <li key={st.id}>
                {/* the number carries the "step" meaning, so the old STEP 1
                    caption above the title was saying it twice */}
                <span className="ps-num" aria-hidden="true">
                  {st.label.match(/\d+/)?.[0] ?? i + 1}
                </span>
                <b>{st.title}</b>
                <span className="ps-text">{st.text}</span>
              </li>
            ))}
          </ol>
        </div>
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
