/** Map legacy HTML filenames to App Router paths. */
export const HTML_TO_PATH: Record<string, string> = {
  "index.html": "/",
  "songs.html": "/songs",
  "occasions.html": "/occasions",
  "how-it-works.html": "/how-it-works",
  "pricing.html": "/pricing",
  "examples.html": "/examples",
  "example.html": "/example",
  "reviews.html": "/reviews",
  "gift-finder.html": "/gift-finder",
  "faq.html": "/faq",
  "guarantee.html": "/guarantee",
  "gift-cards.html": "/gift-cards",
  "referral.html": "/referral",
  "affiliates.html": "/affiliates",
  "sitemap.html": "/sitemap",
  "song-intake.html": "/song-intake",
  "checkout-package.html": "/checkout/package",
  "checkout-review.html": "/checkout/review",
  "checkout-details.html": "/checkout/details",
  "checkout-payment.html": "/checkout/payment",
  "order-confirmed.html": "/order-confirmed",
  "email-confirmation.html": "/email-confirmation",
  "account.html": "/account",
  "dashboard.html": "/dashboard",
  "song-player.html": "/song-player",
  "requests.html": "/requests",
  "downloads.html": "/downloads",
  "share.html": "/share",
};

export function hrefFromHtml(href: string): string {
  if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("data:")) {
    return href;
  }
  const [path, hash] = href.split("#");
  const mapped = HTML_TO_PATH[path] ?? path.replace(/\.html$/, "");
  return hash ? `${mapped}#${hash}` : mapped;
}

export const NAV_LINKS = [
  { href: "/songs", label: "Songs" },
  { href: "/occasions", label: "Occasions" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/examples", label: "Examples" },
  { href: "/reviews", label: "Our Promise" },
] as const;

export const MOBILE_EXTRA_LINKS = [
  { href: "/account", label: "My Account" },
  { href: "/dashboard", label: "My Orders" },
  { href: "/requests", label: "Revisions & Remakes" },
  { href: "/gift-cards", label: "Gift Cards" },
  { href: "/affiliates", label: "Affiliate Partners" },
  { href: "/faq", label: "FAQ" },
] as const;

export const SITE_NAME = "Oncesung";
export const SITE_TAGLINE = "Personalized songs for every occasion.";
