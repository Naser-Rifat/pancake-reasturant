import type { Metadata } from "next";
import OrderSuccessClient from "@/components/OrderSuccessClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your Pancake Club pickup order.",
  robots: { index: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return <OrderSuccessClient publicId={order ?? ""} />;
}
