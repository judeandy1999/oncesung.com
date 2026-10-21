import type { Metadata } from "next";
import { Caveat, DM_Serif_Display, Inter } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteInteractions } from "@/components/SiteInteractions";
import { ToastProvider } from "@/hooks/use-toast";
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
  title: {
    default: `${SITE_TAGLINE} · ${SITE_NAME}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path d='M16 27C9 22 3 17.5 3 11.2 3 7.2 6 4 9.8 4c2.6 0 4.7 1.4 6.2 3.6C17.5 5.4 19.6 4 22.2 4 26 4 29 7.2 29 11.2 29 17.5 23 22 16 27z' fill='%23f25f55'/><path d='M13.5 19.5V10.5l7-1.5v8.4' fill='none' stroke='%23fff' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/><circle cx='11.8' cy='19.6' r='1.9' fill='%23fff'/><circle cx='18.8' cy='17.6' r='1.9' fill='%23fff'/></svg>",
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
          <SiteHeader email={email} />
          {children}
          <SiteFooter email={email} />
          <SiteInteractions />
        </ToastProvider>
      </body>
    </html>
  );
}
