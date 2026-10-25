import type { Metadata } from "next";
import { Caveat, DM_Serif_Display, Inter } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteInteractions } from "@/components/SiteInteractions";
import { ToastProvider } from "@/hooks/use-toast";
import { isAdminEmail } from "@/lib/orders/admin";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.oncesung.com"),
  title: {
    default: `${SITE_TAGLINE} · ${SITE_NAME}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let email: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? null;
  } catch {
    email = null;
  }

  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSerif.variable} ${caveat.variable}`}>
        <ToastProvider>
          <SiteHeader email={email} isAdmin={isAdminEmail(email)} />
          {children}
          <SiteFooter email={email} />
          <SiteInteractions />
        </ToastProvider>
      </body>
    </html>
  );
}
