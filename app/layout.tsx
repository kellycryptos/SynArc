import type { Metadata } from "next";
import { Inter, Sora, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ErrorBoundary } from "@/components/ErrorBoundary";

// display:'optional' — browser uses system fallback if the webfont misses the ~100ms
// block window and does NOT swap later. This eliminates the font-swap-triggered second
// LCP timestamp that was causing the hero <h1> to be re-measured as a late LCP event.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "optional" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "optional" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", display: "optional" });
const ibmPlexMono = IBM_Plex_Mono({ weight: ["400", "500", "600"], subsets: ["latin"], variable: "--font-mono", display: "optional" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.synarcdao.xyz"),
  title: "SynArc — Autonomous Treasury Management on Arc",
  description: "SynArc automates treasury management for Creator DAOs. Schedule payouts, earn yield on idle USDC, rebalance across chains via CCTP, and monitor risk — all governed on-chain.",
  openGraph: {
    title: "SynArc — Autonomous Treasury Management on Arc",
    description: "SynArc automates treasury management for Creator DAOs. Schedule payouts, earn yield on idle USDC, rebalance across chains via CCTP, and monitor risk — all governed on-chain.",
    url: "https://www.synarcdao.xyz",
    siteName: "SynArc",
    images: [
      {
        url: "https://www.synarcdao.xyz/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SynArc — Autonomous Treasury Management on Arc",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SynArc — Autonomous Treasury Management on Arc",
    description: "SynArc automates treasury management for Creator DAOs. Schedule payouts, earn yield on idle USDC, rebalance across chains, and monitor risk — all on-chain.",
    images: ["https://www.synarcdao.xyz/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/og-image.jpg",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased min-h-screen flex flex-col relative bg-background text-foreground`}
      >
        <ThemeProvider>
          <ErrorBoundary sectionName="Root Application">
            {/* Ambient page background */}
            <div className="fixed inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 bg-background" />
              <div className="absolute inset-0 grid-overlay opacity-30" />
              {/* Subtle top glow */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-15"
                style={{
                  background:
                    "radial-gradient(ellipse at top, rgba(47,111,255,0.2) 0%, rgba(34,211,238,0.1) 45%, transparent 70%)",
                }}
              />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
              {children}
            </div>
          </ErrorBoundary>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

