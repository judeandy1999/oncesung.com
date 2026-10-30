import type { Metadata } from "next";
import { Suspense } from "react";
import { LegacyInteractivePage } from "@/components/LegacyInteractivePage";
import { ApplyCreditPackage } from "@/features/gift-cards/ApplyCreditPackage";
import { GiftCreditsNotice } from "@/features/gift-cards/GiftCreditsNotice";
import { listClaimedCreditsForSession } from "@/lib/credits/queries";
import { requireUser } from "@/lib/auth/require-user";
import { INTAKE_SCRIPT } from "@/features/intake/intake-script";
import { INTAKE_SHELL } from "@/features/intake/shell";

export const metadata: Metadata = {
  title: "Tell your story",
  description:
    "Tell us your story: the questionnaire behind every personalized Oncesung song.",
};

export default async function SongIntakePage() {
  await requireUser("/song-intake");
  const credits = await listClaimedCreditsForSession();
  const html = `<div id="intake-app">${INTAKE_SHELL}</div>`;
  return (
    <>
      {credits.length > 0 ? (
        <div className="container" style={{ paddingTop: 16 }}>
          <GiftCreditsNotice credits={credits} />
        </div>
      ) : null}
      <Suspense fallback={null}>
        <ApplyCreditPackage />
      </Suspense>
      <LegacyInteractivePage html={html} script={INTAKE_SCRIPT} label="song-intake" />
    </>
  );
}
