import type { Metadata } from "next";
import { AccountSidebar } from "@/components/AccountSidebar";
import { MyOrdersList } from "@/features/dashboard/MyOrdersList";
import { requireUser } from "@/lib/auth/require-user";
import { getOwnProfile } from "@/lib/account/profile";
import { isAdminConfigured, isAdminEmail } from "@/lib/orders/admin";
import { listOwnPaidOrders } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Songs you have paid for.",
};

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const [profile, orders] = await Promise.all([getOwnProfile(), listOwnPaidOrders()]);
  const name = profile?.fullName || user.email || "Your account";
  const email = profile?.email || user.email || "";
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const showAdmin = isAdminConfigured() && isAdminEmail(user.email);

  return (
    <main>
      <section style={{ padding: "28px 0 48px" }}>
        <div className="container orders-layout">
          <AccountSidebar
            name={name}
            email={email}
            initial={initial}
            active="dashboard"
            showAdmin={showAdmin}
          />
          <div>
            <MyOrdersList orders={orders} />
          </div>
        </div>
      </section>
    </main>
  );
}
