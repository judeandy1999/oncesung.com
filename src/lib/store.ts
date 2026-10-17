"use client";

const PREFIX = "oncesung:";

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(PREFIX + key) ?? sessionStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export const oncesungStore = {
  get<T>(key: string): T | null {
    try {
      const raw = readRaw(key);
      return raw == null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): boolean {
    if (typeof window === "undefined") return false;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      try {
        sessionStorage.removeItem(PREFIX + key);
      } catch {
        /* ignore */
      }
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(PREFIX + key);
      sessionStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};

export type PackageKey = "essential" | "signature" | "concierge";

export const PACKAGES: Record<
  PackageKey,
  { name: string; price: number; delivery: string; features: string[] }
> = {
  essential: {
    name: "Essential",
    price: 49,
    delivery: "48-hour delivery",
    features: ["1 finished song", "Custom lyrics", "1 minor revision", "MP3 download", "48-hour delivery"],
  },
  signature: {
    name: "Signature",
    price: 89,
    delivery: "72-hour delivery",
    features: [
      "Personalized song (up to 3 remakes)",
      "Custom lyrics",
      "Lyrics review before production",
      "MP3 + WAV high-quality audio",
      "72-hour delivery",
    ],
  },
  concierge: {
    name: "Concierge",
    price: 149,
    delivery: "72-hour delivery",
    features: [
      "Everything in Signature",
      "3 instrumentals to choose from",
      "Priority production",
      "Custom cover artwork",
      "72-hour delivery",
    ],
  },
};

export function resolvePackage(key: string | null | undefined): PackageKey {
  if (key === "essential" || key === "signature" || key === "concierge") return key;
  return "signature";
}
