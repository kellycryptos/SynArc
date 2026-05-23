import type { AppProps } from "next/app";
import { Inter, Sora } from "next/font/google";
import "@/app/globals.css";
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

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${inter.variable} ${sora.variable} antialiased min-h-screen flex flex-col relative bg-background text-foreground`}>
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
            <Component {...pageProps} />
          </div>
        </ThemeProvider>
      </Web3Provider>
    </div>
  );
}
