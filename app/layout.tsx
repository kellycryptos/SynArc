import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = { variable: "--font-inter" };
const sora = { variable: "--font-sora" };

export const metadata: Metadata = {
  metadataBase: new URL("https://www.synarcdao.xyz"),
  title: "SynArc",
  description: "SynArc is the governance platform for Creator DAOs — enabling creators and communities to coordinate, vote, and manage USDC treasuries on Arc. Send support, rebalance treasuries, and coordinate seamlessly.",
  openGraph: {
    title: "SynArc — Creator DAO Governance",
    description: "SynArc is the governance platform for Creator DAOs — enabling creators and communities to coordinate, vote, and manage USDC treasuries on Arc. Send support, rebalance treasuries, and coordinate seamlessly.",
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
            {children}
          </div>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

