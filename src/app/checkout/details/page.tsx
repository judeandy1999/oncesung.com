import type { Metadata } from "next";
import { cookies } from "next/headers";
import { sanitizeContactPrefill } from "@/features/checkout/contact-demo";
import { CheckoutDetailsForm } from "@/features/checkout/CheckoutDetailsForm";
import { getOwnProfile } from "@/lib/account/profile";
import { PENDING_ORDER_COOKIE } from "@/lib/orders/pending-order-cookie";

export const metadata: Metadata = {
  title: "Your details",
  description: "Personalized songs for every occasion.",
};

export default async function CheckoutDetailsPage() {
  const profile = await getOwnProfile();
  const prefill = sanitizeContactPrefill(profile?.email, profile?.fullName);
  const pendingOrderId = (await cookies()).get(PENDING_ORDER_COOKIE)?.value ?? null;
  return (
    <CheckoutDetailsForm
      accountName={prefill.fullName}
      accountEmail={prefill.email}
      pendingOrderId={pendingOrderId}
    />
  );
}
