import type { ProgressStep } from "@/features/orders/order-progress";
import { Music, Eye, Download, Check } from "lucide-react";

function StepIcon({ step }: { step: ProgressStep }) {
  if (step.state === "done") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
        <path d="M5 12l5 5 9-10" />
      </svg>
    );
  }
  if (step.key === "production") return <Music size={14} strokeWidth={1.8} />;
  if (step.key === "review") return <Eye size={14} strokeWidth={1.8} />;
  if (step.key === "delivery") return <Download size={14} strokeWidth={1.8} />;
  return <Check size={14} strokeWidth={1.8} />;
}

export function OrderProgressTrack({ steps }: { steps: ProgressStep[] }) {
  return (
    <div className="track" aria-label="Order progress">
      {steps.map((step) => (
        <div key={step.key} className={`t${step.state === "done" ? " done" : ""}${step.state === "cur" ? " cur" : ""}`}>
          <div className="d">
            <StepIcon step={step} />
          </div>
          <b>{step.label}</b>
          <span>{step.detail}</span>
        </div>
      ))}
    </div>
  );
}
