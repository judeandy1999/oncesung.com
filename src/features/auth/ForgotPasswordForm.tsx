"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type AuthState } from "@/features/auth/actions";
import { AuthMessage, AuthShell, AuthSwitch, FieldError } from "@/features/auth/AuthShell";

const initial: AuthState = {};

export function ForgotPasswordForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);

  return (
    <AuthShell
      eyebrow="Account"
      title="Reset your password"
      lede="We will email you a link to choose a new password."
    >
      <AuthMessage error={notice || state.error} success={state.success} />
      <form action={action}>
        <div className="field">
          <label className="lbl" htmlFor="forgot-email">
            Email
          </label>
          <input
            className="input"
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={state.fields?.email ? true : undefined}
            aria-describedby={state.fields?.email ? "forgot-email-error" : undefined}
          />
          <FieldError id="forgot-email-error" message={state.fields?.email} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <AuthSwitch>
        <Link className="link" href="/login">
          Back to sign in
        </Link>
      </AuthSwitch>
    </AuthShell>
  );
}
