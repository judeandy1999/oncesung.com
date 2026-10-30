import { siteOriginForEmail } from "@/lib/email/config";

export function redeemUrlForClaimToken(claimToken: string): string {
  return `${siteOriginForEmail()}/redeem/${claimToken}`;
}
