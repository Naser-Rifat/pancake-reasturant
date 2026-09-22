import type { Metadata } from "next";
import OrderSuccessClient from "@/components/OrderSuccessClient";
import { getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed — The Pancake Club",
  description: "Your Pancake Club pickup order confirmation and real-time status tracker.",
  robots: { index: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const [{ order }, site] = await Promise.all([searchParams, getSite()]);
  return <OrderSuccessClient publicId={order ?? ""} site={site} />;
}
