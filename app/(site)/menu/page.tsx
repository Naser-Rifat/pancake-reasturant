import type { Metadata } from "next";
import MenuClient from "@/components/MenuClient";
import { getMenuWithStatus, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu | KRUSH Pancakes & Stacks",
  description:
    "Six signature pancake stacks — fluffy, fresh, and griddled to order. See the menu and book a table.",
};

export default async function MenuPage() {
  const [{ items, live }, site] = await Promise.all([getMenuWithStatus(), getSite()]);

  return (
    <>
      <section className="menu-hero">
        <div className="container">
          <p className="kicker">The Lineup</p>
          <h1>Stacks On <span className="accent">Stacks.</span></h1>
          <p>Signature pancake stacks. Griddled to order. Zero regrets.</p>
        </div>
      </section>
      <MenuClient items={items} live={live} phone={site.phone} />
    </>
  );
}
