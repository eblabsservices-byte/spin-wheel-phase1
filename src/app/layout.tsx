import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google'
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://game.yesbharath.org'),
  title: "YES BHARATH LUCKY SPIN CONTEST 🎉",
  description: "YES BHARATH SPIN & WIN CONTEST. Spin & win iPhone 17 and other gifts like Smart TV, Airfryer, JBL Speaker! •100% genuine •All spins get gifts. YES BHARATH SPIN & WIN മത്സരം.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "YES BHARATH SPIN & WIN CONTEST",
    description: "YES BHARATH SPIN & WIN CONTEST. Spin & win iPhone 17 and other gifts like Smart TV, Airfryer, JBL Speaker! •100% genuine •All spins get gifts. YES BHARATH SPIN & WIN മത്സരം.",
    url: "https://game.yesbharath.org",
    siteName: "Yes Bharath Wedding Collections Sulthan Bathery",
    images: [
      {
        url: "/poster.png",
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
    images: ["/poster.png"],
  },
  verification: {
    google: "0IBsPqEaerjRKqdydiOx1Es6raKOCPLPUUgMxYf69Bk",
  },
  keywords: ["Yes Bharath", "Lucky Spinner", "Spin and Win", "Contest", "iPhone 17", "Kerala Contest", "Prizes", "Online Game"],
};

import GlobalSnowfall from "@/components/GlobalSnowfall";
import Footer from "@/components/Footer";
import BackgroundMusic from "@/components/BackgroundMusic";
import { SoundProvider } from "@/context/SoundContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} antialiased`}>
        <GoogleAnalytics gaId="G-1909VC848V" />

        <SoundProvider>
          <GlobalSnowfall />
          <BackgroundMusic />
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </SoundProvider>
      </body>
    </html>
  );
}
