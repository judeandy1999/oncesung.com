"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { oncesungStore } from "@/lib/store";
import { CheckoutStepperSection } from "@/features/checkout/CheckoutStepperSection";
import { createCheckoutOrder, readCheckoutDetails, type CheckoutDetails } from "@/features/checkout/saved-order";

const schema = z
  .object({
    fullName: z.string().min(2, "Please enter your name"),
    email: z.string().email("Enter a valid email"),
    updates: z.boolean(),
    isGift: z.boolean(),
    recipient: z.string().optional(),
    recipientEmail: z.string().optional(),
    relationship: z.enum(["Partner", "Friend", "Family"]),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isGift) {
      const recipientEmail = (data.recipientEmail ?? "").trim();
      if (!recipientEmail) {
        ctx.addIssue({ code: "custom", path: ["recipientEmail"], message: "Enter the recipient's email" });
      } else if (!z.string().email().safeParse(recipientEmail).success) {
        ctx.addIssue({ code: "custom", path: ["recipientEmail"], message: "Enter a valid email" });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

const emptyDetails: FormValues = {
  fullName: "",
  email: "",
  updates: true,
  isGift: false,
  recipient: "",
  recipientEmail: "",
  relationship: "Partner",
  notes: "",
};

export function CheckoutDetailsForm({
  accountName = "",
  accountEmail = "",
  pendingOrderId = null,
}: {
  accountName?: string;
  accountEmail?: string;
  pendingOrderId?: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyDetails,
  });

  useEffect(() => {
    const saved = readCheckoutDetails();
    const next: FormValues = {
      ...emptyDetails,
      fullName: saved?.fullName || accountName,
      email: saved?.email || accountEmail,
      updates: saved?.updates ?? true,
      isGift: saved?.isGift ?? false,
      recipient: saved?.recipient || "",
      recipientEmail: saved?.recipientEmail || "",
      relationship: saved?.relationship || "Partner",
      notes: saved?.notes || "",
    };
    reset(next);
  }, [accountEmail, accountName, reset]);

  const notesReg = register("notes");
  const notesLen = watch("notes")?.length ?? 0;
  const isGift = watch("isGift");

  const onSubmit = async (values: FormValues) => {
    setFormError("");
    setSaving(true);
    oncesungStore.set("details", values satisfies CheckoutDetails);
    const result = await createCheckoutOrder(values);
    setSaving(false);
    if ("id" in result) {
      router.push(`/checkout/payment?order=${encodeURIComponent(result.id)}`);
      return;
    }
    if (result.status === 401) {
      router.push(`/login?next=${encodeURIComponent("/checkout/details")}`);
      return;
    }
    setFormError(result.error);
  };

  return (
    <main>
      <section
        style={{
          padding: "8px 0 48px",
          background: "linear-gradient(180deg,#fff8f5,#fff1ec)",
        }}
      >
        <div className="container">
          <CheckoutStepperSection current={2} orderId={pendingOrderId} />

          <form
            className="split"
            style={{ gridTemplateColumns: "1.3fr 1fr" }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <h1 style={{ fontSize: 42 }}>Your details</h1>
              <p className="muted">We&apos;ll use this information to create and deliver your song.</p>
              <div className="card pad-lg">
                <b>Contact information</b>
                <div className="field" style={{ marginTop: 12 }}>
                  <label className="lbl xs">
                    Full name <span className="req">*</span>
                  </label>
                  <input className="input" autoComplete="name" {...register("fullName")} />
                  {errors.fullName && (
                    <p className="xs" style={{ color: "var(--coral-ink)" }}>
                      {errors.fullName.message}
                    </p>
                  )}
                </div>
                <div className="field">
                  <label className="lbl xs">
                    Email address <span className="req">*</span>
                  </label>
                  <input
                    className="input"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="xs" style={{ color: "var(--coral-ink)" }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <label className="check">
                  <input type="checkbox" {...register("updates")} /> Send me updates about my
                  order
                </label>
                <div className="divider" />
                <b>Delivery and privacy</b>
                <div
                  className="notice row between"
                  style={{ marginTop: 12, flexWrap: "nowrap" }}
                >
                  <div className="row" style={{ flexWrap: "nowrap" }}>
                    <div>
                      <b className="small">This is a gift</b>
                      <div className="xs muted">We won&apos;t include any pricing information.</div>
                    </div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" {...register("isGift")} />
                    <span />
                  </label>
                </div>
                <div className="grid g2" style={{ marginTop: 14 }}>
                  <div className="field">
                    <label className="lbl xs">Recipient&apos;s name (for the song)</label>
                    <input className="input" {...register("recipient")} />
                  </div>
                  <div className="field">
                    <label className="lbl xs">Your relationship</label>
                    <select className="select" {...register("relationship")}>
                      <option>Partner</option>
                      <option>Friend</option>
                      <option>Family</option>
                    </select>
                  </div>
                </div>
                {isGift ? (
                  <div className="field" style={{ marginTop: 14 }}>
                    <label className="lbl xs">
                      Recipient&apos;s email <span className="req">*</span>
                    </label>
                    <input
                      className="input"
                      type="email"
                      autoComplete="email"
                      placeholder="Where we send the finished song"
                      {...register("recipientEmail")}
                    />
                    {errors.recipientEmail ? (
                      <p className="xs" style={{ color: "var(--coral-ink)", marginTop: 6 }}>
                        {errors.recipientEmail.message}
                      </p>
                    ) : (
                      <p className="xs muted" style={{ marginTop: 6 }}>
                        We email them a private link to listen and download — no pricing shown.
                      </p>
                    )}
                  </div>
                ) : null}
                <div className="field">
                  <label className="lbl xs">Anything we should know?</label>
                  <textarea
                    className="textarea"
                    maxLength={500}
                    {...notesReg}
                  />
                  <span className="counter">{notesLen}/500</span>
                </div>
              </div>
              <div className="row between" style={{ marginTop: 18 }}>
                <Link className="back" href="/checkout/review">
                  <ArrowLeft size={16} strokeWidth={1.8} /> Back
                </Link>
                <button className="btn btn-primary btn-lg" type="submit" disabled={saving}>
                  {saving ? "Opening payment…" : "Next Step: Payment"}{" "}
                  <ArrowRight size={16} strokeWidth={1.8} />
                </button>
              </div>
              {formError ? (
                <p className="small" style={{ color: "var(--coral-ink)" }}>
                  {formError}
                </p>
              ) : null}
            </div>
            <div>
              <div style={{ position: "relative" }}>
                <div className="ph dusk ph-tall">
                  <svg
                    className="motif"
                    viewBox="0 0 200 140"
                    preserveAspectRatio="xMidYMax slice"
                  >
                    <g fill="rgba(40,22,48,.55)">
                      <circle cx="82" cy="58" r="17" />
                      <path d="M50 140c0-38 14-60 32-60s30 22 30 60z" />
                      <circle cx="118" cy="52" r="18" />
                      <path d="M88 140c2-42 14-66 30-66s32 24 34 66z" />
                    </g>
                  </svg>
                </div>
                <div
                  className="script"
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: "40%",
                    textAlign: "center",
                    color: "#fff",
                    fontSize: 34,
                  }}
                >
                  Turn your moments
                  <br />
                  into memories
                  <br />
                  that last as a song
                </div>
              </div>
              <div
                className="card pad"
                style={{ marginTop: -30, position: "relative", marginInline: 14 }}
              >
                <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", margin: "8px 0" }}>
                  <div>
                    <b className="small">100% private</b>
                    <div className="xs muted">Your personal details are secure.</div>
                  </div>
                </div>
                <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", margin: "8px 0" }}>
                  <div>
                    <b className="small">A meaningful gift</b>
                    <div className="xs muted">Created with care and attention.</div>
                  </div>
                </div>
                <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", margin: "8px 0" }}>
                  <div>
                    <b className="small">Order updates</b>
                    <div className="xs muted">We&apos;ll keep you informed by email.</div>
                  </div>
                </div>
                <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", margin: "8px 0" }}>
                  <div>
                    <b className="small">Easy revisions</b>
                    <div className="xs muted">Optional remakes included.</div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
