import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Web3Provider } from "@/providers/Web3Provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.synarcdao.xyz"),
  title: "SynArc — Confidential Governance Infrastructure on Arc",
  description:
    "Confidential governance infrastructure for programmable organizations, proposal coordination, and USDC-native treasury management on Arc.",
  keywords: [
    "SynArc",
    "DAO",
    "governance",
    "Arc Network",
    "Web3",
    "DeFi",
    "cross-chain",
    "delegation",
    "treasury",
    "privacy",
    "confidential governance",
    "stablecoin-native",
    "USDC treasury",
  ],
  authors: [{ name: "SynArc" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SynArc — Confidential Governance Infrastructure on Arc",
    description:
      "Confidential governance infrastructure for programmable organizations, proposal coordination, and USDC-native treasury management on Arc.",
    url: "https://www.synarcdao.xyz/",
    siteName: "SynArc",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "SynArc — Confidential Governance Infrastructure on Arc",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SynArc — Confidential Governance Infrastructure on Arc",
    description:
      "Confidential governance infrastructure for programmable organizations, proposal coordination, and USDC-native treasury management on Arc.",
    images: ["/logo.png"],
    creator: "@synarc_",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${sora.variable} antialiased min-h-screen flex flex-col relative bg-background text-foreground`}
      >
        <Web3Provider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            disableTransitionOnChange
          >
          {/* Ambient page background */}
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-background" />
            <div className="absolute inset-0 grid-overlay opacity-30" />
            {/* Subtle top glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20"
              style={{
                background:
                  "radial-gradient(ellipse at top, var(--glow-purple, rgba(168,85,247,0.15)) 0%, var(--glow-blue, rgba(59,130,246,0.08)) 40%, transparent 70%)",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
