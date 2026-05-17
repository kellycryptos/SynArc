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
  title: "SynArc — Private Governance Infrastructure for the Arc Ecosystem",
  description:
    "SynArc is a modern governance and delegation platform built on Arc Network, enabling secure DAO coordination, treasury governance, delegate reputation systems, encrypted governance analytics, and scalable on-chain participation.",
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
  ],
  authors: [{ name: "SynArc" }],
  openGraph: {
    title: "SynArc — Private Governance Infrastructure",
    description:
      "Secure DAO coordination, treasury governance, and encrypted analytics on Arc Network.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SynArc",
    description: "Private Governance Infrastructure for the Arc Ecosystem",
  },
  robots: {
    index: true,
    follow: true,
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
