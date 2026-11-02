"use client";

import Link from "next/link";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import {
  CONSENT_OPEN_EVENT,
  CONSENT_PRESETS,
  CONSENT_STORAGE_KEY,
  CONSENT_UPDATE_EVENT,
  readStoredCookieConsent,
  saveCookieConsent,
} from "@/lib/analytics/cookie-consent";

function subscribeStoredConsent(onStoreChange: () => void) {
  const refresh = () => onStoreChange();
  window.addEventListener(CONSENT_UPDATE_EVENT, refresh);
  window.addEventListener("storage", refresh);
  return () => {
    window.removeEventListener(CONSENT_UPDATE_EVENT, refresh);
    window.removeEventListener("storage", refresh);
  };
}

/** Raw localStorage value — stable reference until consent changes (required by useSyncExternalStore). */
function getStoredConsentSnapshot(): string | null {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const titleId = useId();
  const stored = useSyncExternalStore(
    subscribeStoredConsent,
    getStoredConsentSnapshot,
    () => null,
  );
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      const current = readStoredCookieConsent();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setCustomize(Boolean(current));
      setPrefsOpen(true);
    };

    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  const hasStoredChoice = stored !== null && readStoredCookieConsent() !== null;
  const visible = prefsOpen || !hasStoredChoice;

  function dismiss(choice: { analytics: boolean; marketing: boolean }) {
    saveCookieConsent(choice);
    setPrefsOpen(false);
    setCustomize(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-consent-root" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="cookie-consent-panel card pad-lg">
        <div className="cookie-consent-copy">
          <p id={titleId} className="cookie-consent-title">
            Cookies &amp; privacy
          </p>
          <p className="small muted cookie-consent-text">
            We use essential cookies to run checkout and your account. With your permission, we also use analytics
            and marketing cookies to measure visits and ad performance.{" "}
            <Link href="/faq#contact" className="link">
              Learn more
            </Link>
          </p>
        </div>

        {customize ? (
          <div className="cookie-consent-custom">
            <label className="check cookie-consent-option">
              <input type="checkbox" checked disabled />
              <span>
                <b>Essential</b>
                <span className="xs muted" style={{ display: "block" }}>
                  Required for sign-in, checkout, and security.
                </span>
              </span>
            </label>
            <label className="check cookie-consent-option">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              <span>
                <b>Analytics</b>
                <span className="xs muted" style={{ display: "block" }}>
                  Helps us understand how the site is used (Google Analytics).
                </span>
              </span>
            </label>
            <label className="check cookie-consent-option">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              <span>
                <b>Marketing</b>
                <span className="xs muted" style={{ display: "block" }}>
                  Conversion measurement for ads (Google Tag Manager / Ads).
                </span>
              </span>
            </label>
            <div className="row cookie-consent-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => dismiss({ analytics, marketing })}>
                Save choices
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  if (hasStoredChoice) {
                    setPrefsOpen(false);
                    setCustomize(false);
                  } else {
                    setCustomize(false);
                  }
                }}
              >
                {hasStoredChoice ? "Close" : "Back"}
              </button>
            </div>
          </div>
        ) : (
          <div className="row cookie-consent-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => dismiss(CONSENT_PRESETS.all)}
            >
              Accept all
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => dismiss(CONSENT_PRESETS.essential)}
            >
              Essential only
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCustomize(true)}>
              Customize
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
