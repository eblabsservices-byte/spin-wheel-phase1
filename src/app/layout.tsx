import type { Metadata } from "next";
import Script from "next/script";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "YES BHARATH LUCKY SPIN CONTEST 🎉",
  description: "YES BHARATH SPIN & WIN CONTEST. Spin & win iPhone 17 and other gifts like Smart TV, Airfryer, JBL Speaker! •100% genuine •All spins get gifts. YES BHARATH SPIN & WIN മത്സരം.",
  openGraph: {
    title: "YES BHARATH SPIN & WIN CONTEST",
    description: "YES BHARATH SPIN & WIN CONTEST. Spin & win iPhone 17 and other gifts like Smart TV, Airfryer, JBL Speaker! •100% genuine •All spins get gifts. YES BHARATH SPIN & WIN മത്സരം.",
    url: "https://game.yesbharath.org",
    siteName: "Yes Bharath Wedding Collections Sulthan Bathery",
    images: [
      {
        url: "https://game.yesbharath.org/poster.png",
        width: 1200,
        height: 630,
        alt: "Yes Bharath Lucky Spinner Contest",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YES BHARATH SPIN & WIN CONTEST",
    description: "Spin & win iPhone 17 and other gifts! 100% genuine contest.",
    images: ["https://game.yesbharath.org/poster.png"],
  },
  verification: {
    google: "0IBsPqEaerjRKqdydiOx1Es6raKOCPLPUUgMxYf69Bk",
  },
};

import GlobalSnowfall from "@/components/GlobalSnowfall";
import BackgroundMusic from "@/components/BackgroundMusic";
import { SoundProvider } from "@/context/SoundContext";
import GAListener from "@/components/GAListener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} antialiased`}>
        {/* Google Analytics Script */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        {/* Page change tracking GA4 */}
        <GAListener />

        <SoundProvider>
          <GlobalSnowfall />
          <BackgroundMusic />
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}
