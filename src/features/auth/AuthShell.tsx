import type { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  return (
    <main>
      <section style={{ padding: "48px 0 72px", background: "linear-gradient(180deg,#fff8f5,#fff1ec)" }}>
        <div className="container" style={{ maxWidth: 480 }}>
          <span className="eyebrow">{eyebrow}</span>
          <h1 style={{ fontSize: "clamp(36px, 4vw, 48px)" }}>{title}</h1>
          <p className="muted">{lede}</p>
          <div className="card pad-lg">
            {children}
            <p className="small muted" style={{ margin: "16px 0 0" }}>
              <Link className="link" href="/">
                Back home
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export function AuthMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="form-success" role="status">
        {success}
      </p>
    );
  }
  return null;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="form-error" style={{ marginTop: 6 }}>
      {message}
    </p>
  );
}

export function AuthDivider() {
  return (
    <div className="auth-or" role="separator">
      <span>or</span>
    </div>
  );
}

export function AuthSwitch({ children }: { children: ReactNode }) {
  return (
    <p className="small muted" style={{ margin: "16px 0 0" }}>
      {children}
    </p>
  );
}
