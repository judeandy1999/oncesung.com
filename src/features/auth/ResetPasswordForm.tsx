"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordAction, type AuthState } from "@/features/auth/actions";
import { AuthMessage, AuthShell, FieldError } from "@/features/auth/AuthShell";

const initial: AuthState = {};

export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);

  if (!hasSession) {
    return (
      <AuthShell
        eyebrow="Account"
        title="Link expired"
        lede="This password reset link is invalid or has expired."
      >
        <p className="form-error" role="alert">
          Request a new link and open it on this device.
        </p>
        <Link className="btn btn-primary btn-block" href="/forgot-password">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account"
      title="Choose a new password"
      lede="Use at least 8 characters. You will stay signed in afterward."
    >
      <AuthMessage error={state.error} success={state.success} />
      <form action={action}>
        <div className="field">
          <label className="lbl" htmlFor="reset-password">
            New password
          </label>
          <input
            className="input"
            id="reset-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={state.fields?.password ? true : undefined}
            aria-describedby={state.fields?.password ? "reset-password-error" : undefined}
          />
          <FieldError id="reset-password-error" message={state.fields?.password} />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="reset-confirm">
            Confirm password
          </label>
          <input
            className="input"
            id="reset-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={state.fields?.confirmPassword ? true : undefined}
            aria-describedby={state.fields?.confirmPassword ? "reset-confirm-error" : undefined}
          />
          <FieldError id="reset-confirm-error" message={state.fields?.confirmPassword} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
