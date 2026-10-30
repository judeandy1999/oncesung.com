import type { Metadata } from "next";
import { AccountAreaLayout } from "@/components/AccountAreaLayout";
import { MyOrdersList } from "@/features/dashboard/MyOrdersList";
import { GiftCreditsPanel } from "@/features/dashboard/GiftCreditsPanel";
import { NotificationBanner } from "@/features/dashboard/NotificationBanner";
import { listClaimedCreditsForSession } from "@/lib/credits/queries";
import { listOwnPaidOrders } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Songs you have paid for.",
};

export default async function DashboardPage() {
  const [orders, credits] = await Promise.all([listOwnPaidOrders(), listClaimedCreditsForSession()]);

  return (
    <AccountAreaLayout active="dashboard" loginNext="/dashboard">
      <NotificationBanner />
      <GiftCreditsPanel credits={credits} />
      <MyOrdersList orders={orders} />
    </AccountAreaLayout>
  );
}
