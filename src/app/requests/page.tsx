import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountAreaLayout } from "@/components/AccountAreaLayout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RevisionsRemakesPanel } from "@/features/requests/RevisionsRemakesPanel";
import {
  listEligibleRevisionOrders,
  listSongChangeRequestsForSession,
} from "@/lib/revisions/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Revisions & Remakes",
  description: "Request changes to your delivered songs.",
};

export default async function RequestsPage() {
  const [eligibleOrders, requests] = await Promise.all([
    listEligibleRevisionOrders(),
    listSongChangeRequestsForSession(),
  ]);

  return (
    <AccountAreaLayout active="requests" loginNext="/requests">
      <Suspense fallback={<LoadingSpinner label="Loading requests…" />}>
        <RevisionsRemakesPanel eligibleOrders={eligibleOrders} initialRequests={requests} />
      </Suspense>
    </AccountAreaLayout>
  );
}
