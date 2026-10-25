import type { CheckoutStep } from "@/features/checkout/CheckoutStepper";

export function checkoutStepHref(step: CheckoutStep, orderId: string | null): string | null {
  switch (step) {
    case 1:
      return "/checkout/review";
    case 2:
      return "/checkout/details";
    case 3:
      return orderId ? `/checkout/payment?order=${encodeURIComponent(orderId)}` : null;
    case 4:
      return orderId ? `/order-confirmed?order=${encodeURIComponent(orderId)}` : null;
    default:
      return null;
  }
}

/** Remove the static stepper from exported checkout HTML so React can render one stepper. */
export function stripCheckoutStepper(html: string): string {
  return html.replace(/<div class="stepper">[\s\S]*?<\/div>\s*(?=<div class="split)/, "");
}
