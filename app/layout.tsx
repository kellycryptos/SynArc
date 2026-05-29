import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Web3Provider } from "@/providers/Web3Provider";
import { PageWrapper } from "@/components/layout/PageWrapper";

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
  title: "SynArc",
  description: "SynArc is governance infrastructure for the agentic economy — enabling DAOs, AI agents, and autonomous systems to coordinate, vote, and manage USDC-native treasuries on Arc. The first multi-DAO governance layer built natively on Arc with Circle’s full stablecoin stack.",
  openGraph: {
    title: "SynArc — Governance Infrastructure",
    description: "SynArc is governance infrastructure for the agentic economy — enabling DAOs, AI agents, and autonomous systems to coordinate, vote, and manage USDC-native treasuries on Arc. The first multi-DAO governance layer built natively on Arc with Circle’s full stablecoin stack.",
    url: "https://www.synarcdao.xyz",
    siteName: "SynArc",
    images: [
      {
        url: "https://www.synarcdao.xyz/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SynArc Governance",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
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
        className={`${inter.variable} ${sora.variable} antialiased min-h-screen flex flex-col relative bg-background text-foreground`}
      >
        <Web3Provider>
          <ThemeProvider>
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
            <PageWrapper>
              {children}
            </PageWrapper>
          </div>
        </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
