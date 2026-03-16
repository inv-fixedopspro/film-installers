import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { APP_NAME, APP_DOMAIN } from "@/lib/constants";
import { Toaster } from "@/components/ui/toaster";
import { CookieConsentBanner } from "@/components/shared/cookie-consent-banner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} | Window Tint, PPF & Vinyl Wrap Jobs`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "Find film installer jobs or hire skilled window tint, PPF, and vinyl wrap pros. Browse job listings, build your installer resume, and connect with shops hiring near you.",
  keywords: [
    "film installers",
    "jobs",
    "window tint",
    "job listings",
    "paint protection film",
    "ppf",
    "architectural film",
    "vinyl wrap",
    "resume",
    "resume builder",
    "hiring near me",
  ],
  authors: [{ name: APP_NAME }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `https://${APP_DOMAIN}`,
    siteName: APP_NAME,
    title: `${APP_NAME} | Window Tint, PPF & Vinyl Wrap Jobs`,
    description:
      "Find film installer jobs or hire skilled window tint, PPF, and vinyl wrap pros. Browse job listings and build your installer resume.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} | Window Tint, PPF & Vinyl Wrap Jobs`,
    description:
      "Find film installer jobs or hire skilled window tint, PPF, and vinyl wrap pros. Browse job listings and build your installer resume.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
