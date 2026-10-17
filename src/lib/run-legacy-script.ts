const ranLabels = new Set<string>();

/** Dual-write ZIP session keys to localStorage for non-sensitive progress. */
function patchStorage() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __oncesungStoragePatched?: boolean };
  if (w.__oncesungStoragePatched) return;
  w.__oncesungStoragePatched = true;

  const ss = window.sessionStorage;
  const ls = window.localStorage;
  const origSsSet = ss.setItem.bind(ss);
  ss.setItem = (key: string, value: string) => {
    origSsSet(key, value);
    if (key.startsWith("oncesung:")) {
      try {
        ls.setItem(key, value);
      } catch {
        /* ignore */
      }
    }
  };
}

export function rewriteLegacyNavInSource(src: string): string {
  return src
    .replace(/location\.href\s*=\s*'checkout-review\.html'/g, "location.href='/checkout/review'")
    .replace(/location\.href\s*=\s*'song-intake\.html'/g, "location.href='/song-intake'")
    .replace(/location\.href\s*=\s*'checkout-payment\.html'/g, "location.href='/checkout/payment'")
    .replace(/location\.href\s*=\s*'checkout-details\.html'/g, "location.href='/checkout/details'")
    .replace(/location\.href\s*=\s*'order-confirmed\.html'/g, "location.href='/order-confirmed'")
    .replace(/sessionStorage\.setItem\('oncesung:story'/g, "localStorage.setItem('oncesung:story'")
    .replace(/sessionStorage\.setItem\('oncesung:brief'/g, "localStorage.setItem('oncesung:brief'")
    .replace(
      /sessionStorage\.setItem\('oncesung:edit-brief'/g,
      "localStorage.setItem('oncesung:edit-brief'",
    )
    .replace(
      /sessionStorage\.getItem\('oncesung:edit-brief'\)/g,
      "(localStorage.getItem('oncesung:edit-brief')||sessionStorage.getItem('oncesung:edit-brief'))",
    )
    .replace(
      /sessionStorage\.removeItem\('oncesung:edit-brief'\)/g,
      "void (function(){try{localStorage.removeItem('oncesung:edit-brief')}catch(e){}try{sessionStorage.removeItem('oncesung:edit-brief')}catch(e){}})()",
    )
    .replace(
      /sessionStorage\.getItem\('oncesung:package'\)/g,
      "(localStorage.getItem('oncesung:package')||sessionStorage.getItem('oncesung:package'))",
    );
}

export function clearLegacyLabel(label: string) {
  ranLabels.delete(label);
}

export function runLegacyScript(source: string, label: string) {
  if (ranLabels.has(label)) return;
  ranLabels.add(label);
  patchStorage();
  const code = rewriteLegacyNavInSource(source);
  const fn = new Function(code);
  try {
    fn();
  } catch (err) {
    ranLabels.delete(label);
    console.error(`[oncesung] legacy script failed: ${label}`, err);
  }
}
