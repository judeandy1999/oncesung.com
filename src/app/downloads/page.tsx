import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Downloads",
  description: "Play and download paid songs from My Orders.",
};

export default async function DownloadsPage() {
  await requireUser("/downloads");
  return (
    <main>
      <section>
        <div className="container" style={{ padding: "48px 0" }}>
          <h1>Your songs are on My Orders</h1>
          <p className="muted">Play and download a song there after it has been uploaded. This page no longer shows sample files.</p>
          <Link className="btn btn-primary" href="/dashboard">
            My Orders
          </Link>
        </div>
      </section>
    </main>
  );
}
