import { Suspense } from "react";
import { CheckoutStepper, type CheckoutStep } from "@/features/checkout/CheckoutStepper";

export function CheckoutStepperSection({
  current,
  orderId,
}: {
  current: CheckoutStep;
  orderId?: string | null;
}) {
  return (
    <Suspense fallback={null}>
      <CheckoutStepper current={current} orderId={orderId} />
    </Suspense>
  );
}
