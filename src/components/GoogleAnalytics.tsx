import Script from "next/script";
import { GOOGLE_ADS_ID } from "@/lib/analytics/google-ads";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-9TVHQH24GD";

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  const adsConfigLine = GOOGLE_ADS_ID ? `\ngtag('config', '${GOOGLE_ADS_ID}');` : "";

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');${adsConfigLine}
`.trim(),
        }}
      />
    </>
  );
}
