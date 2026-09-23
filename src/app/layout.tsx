import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Instrument_Sans, Silkscreen } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const SITE_URL = "https://shiftly.site";
const TITLE = "Shiftly — Logiciel de planning et gestion d'équipe pour TPE/PME";
const DESCRIPTION =
  "Shiftly simplifie la création de plannings, le pointage par QR code et la gestion des demandes RH pour les commerces, restaurants et petites équipes. Gratuit jusqu'à 5 employés.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — Shiftly",
  },
  description: DESCRIPTION,
  keywords: [
    "logiciel planning employés",
    "gestion planning équipe",
    "planning restaurant",
    "planning commerce",
    "logiciel RH TPE PME",
    "pointage QR code",
    "gestion des horaires salariés",
    "alternative Skello",
    "planning en ligne gratuit",
  ],
  authors: [{ name: "Shiftly" }],
  icons: {
    icon: [{ url: "/icon-512.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Shiftly",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Shiftly — planning d'équipe simplifié" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('shiftly_theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})()` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${instrumentSans.variable} ${silkscreen.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
