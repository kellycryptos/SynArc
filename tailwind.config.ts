import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2F6FFF',
          light: '#4F8BFF',
          dark: '#1E52D4',
        },
        positive: '#22C55E',
        negative: '#EF4444',
        background: {
          primary: "var(--bg-primary)",
          surface: "var(--bg-surface)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        border: "var(--border)",
        accent: {
          purple: "var(--accent-purple)",
          blue: "var(--accent-blue)",
        },
      },
      fontFamily: {
        space: ["Space Grotesk", "sans-serif"],
        heading: ["Space Grotesk", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
        inter: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        sora: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        editorial: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
