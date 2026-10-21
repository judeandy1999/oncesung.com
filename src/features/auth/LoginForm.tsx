"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthState } from "@/features/auth/actions";
import { AuthDivider, AuthMessage, AuthShell, AuthSwitch, FieldError } from "@/features/auth/AuthShell";
import { GoogleSignIn } from "@/features/auth/GoogleSignIn";

const initial: AuthState = {};

export function LoginForm({ nextPath, notice }: { nextPath: string; notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <AuthShell
      eyebrow="Account"
      title="Welcome back"
      lede="Sign in to see your songs, orders, and downloads."
    >
      {notice ? <AuthMessage error={notice} /> : null}
      <GoogleSignIn nextPath={nextPath} />
      <AuthDivider />
      <form action={action}>
        <AuthMessage error={state.error} success={state.success} />
        <input type="hidden" name="next" value={nextPath} />
        <div className="field">
          <label className="lbl" htmlFor="login-email">
            Email
          </label>
          <input
            className="input"
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={state.fields?.email ? true : undefined}
            aria-describedby={state.fields?.email ? "login-email-error" : undefined}
          />
          <FieldError id="login-email-error" message={state.fields?.email} />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="login-password">
            Password
          </label>
          <input
            className="input"
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={state.fields?.password ? true : undefined}
            aria-describedby={state.fields?.password ? "login-password-error" : undefined}
          />
          <FieldError id="login-password-error" message={state.fields?.password} />
        </div>
        <p className="small" style={{ margin: "-6px 0 16px" }}>
          <Link className="link" href="/forgot-password">
            Forgot password?
          </Link>
        </p>
        <button className="btn btn-primary btn-block" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <AuthSwitch>
        New here?{" "}
        <Link className="link" href={`/register?next=${encodeURIComponent(nextPath)}`}>
          Create an account
        </Link>
      </AuthSwitch>
    </AuthShell>
  );
}
