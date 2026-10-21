"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthState } from "@/features/auth/actions";
import { AuthDivider, AuthMessage, AuthShell, AuthSwitch, FieldError } from "@/features/auth/AuthShell";
import { GoogleSignIn } from "@/features/auth/GoogleSignIn";

const initial: AuthState = {};

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <AuthShell
      eyebrow="Account"
      title="Create your account"
      lede="Save your songs and come back for downloads when an order is ready."
    >
      <GoogleSignIn nextPath={nextPath} />
      <AuthDivider />
      <form action={action}>
        <AuthMessage error={state.error} success={state.success} />
        <div className="field">
          <label className="lbl" htmlFor="register-name">
            Your name
          </label>
          <input
            className="input"
            id="register-name"
            name="fullName"
            autoComplete="name"
            required
            maxLength={100}
            aria-invalid={state.fields?.fullName ? true : undefined}
            aria-describedby={state.fields?.fullName ? "register-name-error" : undefined}
          />
          <FieldError id="register-name-error" message={state.fields?.fullName} />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="register-email">
            Email
          </label>
          <input
            className="input"
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={state.fields?.email ? true : undefined}
            aria-describedby={state.fields?.email ? "register-email-error" : undefined}
          />
          <FieldError id="register-email-error" message={state.fields?.email} />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="register-password">
            Password
          </label>
          <input
            className="input"
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={state.fields?.password ? true : undefined}
            aria-describedby="register-password-hint"
          />
          <p id="register-password-hint" className={state.fields?.password ? "form-error" : "xs muted"} style={{ marginTop: 6 }}>
            {state.fields?.password ?? "At least 8 characters."}
          </p>
        </div>
        <div className="field">
          <label className="lbl" htmlFor="register-confirm">
            Confirm password
          </label>
          <input
            className="input"
            id="register-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={state.fields?.confirmPassword ? true : undefined}
            aria-describedby={state.fields?.confirmPassword ? "register-confirm-error" : undefined}
          />
          <FieldError id="register-confirm-error" message={state.fields?.confirmPassword} />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <AuthSwitch>
        Already have an account?{" "}
        <Link className="link" href={`/login?next=${encodeURIComponent(nextPath)}`}>
          Sign in
        </Link>
      </AuthSwitch>
    </AuthShell>
  );
}
