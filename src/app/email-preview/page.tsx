import type { Metadata } from "next";
import Link from "next/link";
import { EmailPreviewGallery } from "@/features/email/EmailPreviewGallery";
import { emailPreviewSamples } from "@/lib/email/preview-samples";

export const metadata: Metadata = {
  title: "Email previews",
  description: "Preview transactional emails sent by Oncesung.",
  robots: { index: false, follow: false },
};

export default function EmailPreviewPage() {
  const items = emailPreviewSamples();

  return (
    <main>
      <section>
        <div className="container" style={{ padding: "48px 0" }}>
          <Link className="back xs" href="/email-confirmation">
            ← Marketing mock (4-step hero)
          </Link>
          <h1 style={{ fontSize: 38, marginTop: 12 }}>Transactional email previews</h1>
          <p className="muted">Sample data — same HTML as production sends via Resend.</p>
          <div style={{ marginTop: 24 }}>
            <EmailPreviewGallery items={items} />
          </div>
        </div>
      </section>
    </main>
  );
}
