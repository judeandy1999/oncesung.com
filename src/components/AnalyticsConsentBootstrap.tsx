import Script from "next/script";
import { CONSENT_STORAGE_KEY } from "@/lib/analytics/cookie-consent";

/** Consent defaults before GTM/GA load; replays stored choice from localStorage when present. */
export function AnalyticsConsentBootstrap() {
  const storageKey = CONSENT_STORAGE_KEY;

  return (
    <Script
      id="analytics-consent-bootstrap"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500
});
try {
  var raw = localStorage.getItem(${JSON.stringify(storageKey)});
  if (raw) {
    var c = JSON.parse(raw);
    if (c && typeof c.analytics === 'boolean' && typeof c.marketing === 'boolean') {
      var a = c.analytics ? 'granted' : 'denied';
      var m = c.marketing ? 'granted' : 'denied';
      gtag('consent', 'update', {
        ad_storage: m,
        analytics_storage: a,
        ad_user_data: m,
        ad_personalization: m,
        functionality_storage: (c.analytics || c.marketing) ? 'granted' : 'denied',
        personalization_storage: m,
        security_storage: 'granted'
      });
    }
  }
} catch (e) {}
`.trim(),
      }}
    />
  );
}
