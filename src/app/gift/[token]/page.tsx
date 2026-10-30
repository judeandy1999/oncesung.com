import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GiftSongPlayer } from "@/features/gift/GiftSongPlayer";
import { getOrderByGiftToken } from "@/lib/orders/record";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your song",
  robots: { index: false, follow: false },
};

export default async function GiftSongPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getOrderByGiftToken(token).catch(() => null);
  if (!order?.song_storage_path) notFound();

  return (
    <main>
      <section>
        <div className="container" style={{ padding: "48px 0" }}>
          <GiftSongPlayer
            token={token}
            recipientName={order.recipient_name}
            filename={order.song_filename || "song.mp3"}
          />
        </div>
      </section>
    </main>
  );
}
