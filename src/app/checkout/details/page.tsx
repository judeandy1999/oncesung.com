import type { Metadata } from "next";
import { CheckoutDetailsForm } from "@/features/checkout/CheckoutDetailsForm";

export const metadata: Metadata = {
  title: "Your details",
  description: "Personalized songs for every occasion.",
};

export default function CheckoutDetailsPage() {
  return <CheckoutDetailsForm />;
}
