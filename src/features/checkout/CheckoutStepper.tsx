"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { checkoutStepHref } from "@/features/checkout/checkout-steps";
import { oncesungStore } from "@/lib/store";

export type CheckoutStep = 1 | 2 | 3 | 4;

const LABELS = ["Package", "Your Details", "Payment", "Review"] as const;

export function isCheckoutStepNavigable(
  step: CheckoutStep,
  current: CheckoutStep,
  href: string | null,
): boolean {
  if (!href) return false;
  if (step < current) return true;
  if (step === current + 1 && step <= 3) return true;
  return false;
}

function StepMark({ step, current }: { step: CheckoutStep; current: CheckoutStep }) {
  if (step < current) return <span className="n">✓</span>;
  return <span className="n">{step}</span>;
}

function useCheckoutOrderId(orderIdProp: string | null | undefined): string | null {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("order");
  const [storedOrder, setStoredOrder] = useState<string | null>(null);
  useEffect(() => {
    setStoredOrder(oncesungStore.get<string>("pending-order"));
  }, []);
  if (orderIdProp) return orderIdProp;
  if (fromUrl) return fromUrl;
  return storedOrder;
}

export function CheckoutStepper({
  current,
  orderId: orderIdProp,
}: {
  current: CheckoutStep;
  orderId?: string | null;
}) {
  const orderId = useCheckoutOrderId(orderIdProp);

  return (
    <div className="stepper" data-checkout-stepper-managed>
      {LABELS.map((label, index) => {
        const step = (index + 1) as CheckoutStep;
        const done = step < current;
        const cur = step === current;
        const href = checkoutStepHref(step, orderId);
        const linkHref = isCheckoutStepNavigable(step, current, href) ? href : null;

        const body = (
          <>
            <StepMark step={step} current={current} />
            <span className="lbl-t">{label}</span>
          </>
        );

        return (
          <span key={label} style={{ display: "contents" }}>
            {index > 0 ? <div className={`step-line${done || cur ? " done" : ""}`} /> : null}
            {linkHref ? (
              <Link
                className={`step step-link${done ? " done" : ""}${cur ? " cur" : ""}`}
                href={linkHref}
                aria-current={cur ? "step" : undefined}
              >
                {body}
              </Link>
            ) : (
              <div className={`step${done ? " done" : ""}${cur ? " cur" : ""}`} aria-current={cur ? "step" : undefined}>
                {body}
              </div>
            )}
          </span>
        );
      })}
    </div>
  );
}
