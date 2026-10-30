import type { Metadata } from "next";
import { Suspense } from "react";
import { LegacyInteractivePage } from "@/components/LegacyInteractivePage";
import { ApplyCreditPackage } from "@/features/gift-cards/ApplyCreditPackage";
import { INTAKE_SCRIPT } from "@/features/intake/intake-script";
import { INTAKE_SHELL } from "@/features/intake/shell";

export const metadata: Metadata = {
  title: "Tell your story",
  description:
    "Tell us your story: the questionnaire behind every personalized Oncesung song.",
};

export default function SongIntakePage() {
  const html = `<div id="intake-app">${INTAKE_SHELL}</div>`;
  return (
    <>
      <Suspense fallback={null}>
        <ApplyCreditPackage />
      </Suspense>
      <LegacyInteractivePage html={html} script={INTAKE_SCRIPT} label="song-intake" />
    </>
  );
}
