import type { Metadata } from "next";
import { HtmlMain } from "@/components/HtmlMain";
import { html_song_player } from "@/data/page-content";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Our First Year \u2014 First Version",
  description: "Personalized songs for every occasion.",
};

export default async function Page() {
  await requireUser("/song-player");
  return <HtmlMain html={html_song_player} />;
}
