import Script from "next/script";
import { GOOGLE_ADS_ID } from "@/lib/analytics/google-ads";

/** Loads the Google Ads gtag so Tag Assistant / Ads diagnostics detect AW-… on every page. */
export function GoogleAdsTag() {
  if (!GOOGLE_ADS_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-ads-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){dataLayer.push(arguments);};
gtag('config', '${GOOGLE_ADS_ID}');
`.trim(),
        }}
      />
    </>
  );
}
