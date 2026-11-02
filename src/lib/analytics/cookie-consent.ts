export const CONSENT_STORAGE_KEY = "oncesung_cookie_consent_v1";
export const CONSENT_UPDATE_EVENT = "consent_update";
export const CONSENT_OPEN_EVENT = "cookie_consent_open";

export type StoredCookieConsent = {
  analytics: boolean;
  marketing: boolean;
  ts: number;
};

export type GoogleConsentFlags = {
  ad_storage: "granted" | "denied";
  analytics_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
  functionality_storage: "granted" | "denied";
  personalization_storage: "granted" | "denied";
  security_storage: "granted";
};

export function toGoogleConsentFlags(choice: {
  analytics: boolean;
  marketing: boolean;
}): GoogleConsentFlags {
  const analytics = choice.analytics ? "granted" : "denied";
  const marketing = choice.marketing ? "granted" : "denied";
  return {
    ad_storage: marketing,
    analytics_storage: analytics,
    ad_user_data: marketing,
    ad_personalization: marketing,
    functionality_storage: choice.analytics || choice.marketing ? "granted" : "denied",
    personalization_storage: marketing,
    security_storage: "granted",
  };
}

export const CONSENT_PRESETS = {
  all: { analytics: true, marketing: true },
  essential: { analytics: false, marketing: false },
} as const;

export function readStoredCookieConsent(): StoredCookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCookieConsent;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredCookieConsent(choice: { analytics: boolean; marketing: boolean }): StoredCookieConsent {
  const stored: StoredCookieConsent = { ...choice, ts: Date.now() };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Private mode — consent still applies for this session via gtag update.
  }
  return stored;
}

export function hasStoredCookieConsent(): boolean {
  return readStoredCookieConsent() !== null;
}

function pushGtagConsent(mode: "default" | "update", flags: GoogleConsentFlags) {
  window.dataLayer = window.dataLayer || [];
  const gtag = window.gtag;
  if (typeof gtag === "function") {
    gtag("consent", mode, flags);
    return;
  }
  window.dataLayer.push(["consent", mode, flags]);
}

/** Sync Google Consent Mode v2 and notify conversion trackers. */
export function applyCookieConsent(
  choice: { analytics: boolean; marketing: boolean },
  mode: "default" | "update" = "update",
) {
  if (typeof window === "undefined") return;
  pushGtagConsent(mode, toGoogleConsentFlags(choice));
  if (mode === "update") {
    window.dispatchEvent(new Event(CONSENT_UPDATE_EVENT));
  }
}

export function saveCookieConsent(choice: { analytics: boolean; marketing: boolean }) {
  writeStoredCookieConsent(choice);
  applyCookieConsent(choice, "update");
}

export function openCookieConsentPreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
