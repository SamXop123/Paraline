import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { MainWrapper } from "@/components/MainWrapper";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Paraline - Desktop Audio Visualizer for Windows",
    template: "%s - Paraline",
  },
  description: "Paraline is an audio-reactive edge visualizer for Windows desktops. Make Windows feel ambient with a desktop audio visualizer that dances to your music.",
  keywords: ["desktop audio visualizer", "Windows audio visualizer", "music visualizer", "audio-reactive", "edge visualizer", "Paraline"],
  alternates: {
    canonical: "https://paraline.vercel.app/",
  },
  openGraph: {
    title: "Paraline - Audio-reactive Edge Visualizer for Windows",
    description: "Make Windows feel ambient with an audio-reactive edge visualizer. A desktop audio visualizer built for Windows.",
    url: "https://paraline.vercel.app/",
    siteName: "Paraline",
    images: [
      {
        url: "https://paraline.vercel.app/logo.png",
        width: 1200,
        height: 630,
        alt: "Paraline Logo",
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paraline - Audio-reactive Edge Visualizer for Windows",
    description: "A desktop audio visualizer that turns your Windows edges into reactive light.",
    images: ["https://paraline.vercel.app/logo.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Paraline",
  "description": "An audio-reactive edge visualizer for Windows desktops that paints motion along your screen edges.",
  "applicationCategory": "MultimediaApplication",
  "operatingSystem": "Windows",
  "image": "https://paraline.vercel.app/logo.png",
  "url": "https://paraline.vercel.app/",
  "sameAs": ["https://github.com/SamXop123/Paraline"],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="pointer-events-none fixed inset-0 z-[-1] bg-noise" />
        
        <Sidebar />
        
        <MainWrapper>
          {children}
          <Footer />
        </MainWrapper>

        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <Analytics />
      </body>
    </html>
  );
}
