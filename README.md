# SynArc DAO

A production-grade decentralized governance frontend for the Arc ecosystem. Built with Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion, and Recharts.

## Features

- **Dashboard** — Real-time DAO overview with key metrics, treasury activity, and health indicators
- **Members** — 8 DAO members with reputation levels (Novice → Architect), voting stats, delegated power, and search/filter
- **Analytics** — Interactive charts (participation, proposals, delegation, treasury allocation), growth metrics, treasury activity table, and DAO health scores
- **Settings** — Arc Testnet configuration, governance thresholds, voting duration, treasury permissions, wallet & security preferences
- **Footer** — SynArc branding, Arc ecosystem links, GitHub, Docs, Twitter/X, Privacy Policy, Terms

## Arc Testnet Configuration

| Parameter | Value |
|-----------|-------|
| RPC | `https://rpc.testnet.arc.network` |
| Chain ID | `5042002` |
| Currency | `USDC` |
| Explorer | `https://testnet.arcscan.app` |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with custom glassmorphism theme
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Fonts**: Geist (Sans + Mono)

## Folder Structure

```
src/
  app/              # Next.js App Router pages
    page.tsx        # Dashboard (Home)
    members/page.tsx
    analytics/page.tsx
    settings/page.tsx
    layout.tsx      # Root layout with Navbar + Footer + SEO
    globals.css     # Tailwind theme + custom CSS
  components/
    layout/         # Navbar, Footer
    ui/             # GlassCard, StatCard, SkeletonLoader, EmptyState
    charts/         # ParticipationChart, ProposalsChart, DelegationChart, TreasuryChart
  hooks/            # Custom React hooks
  lib/              # Utilities, mock data, network config
  types/            # TypeScript interfaces
  contracts/        # Smart contract ABIs
  utils/            # Helper functions
  styles/           # Additional styles
```

## Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# The static export is output to ./dist
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Framework preset: **Next.js**
4. Build command: `npm run build`
5. Output directory: `dist`

### Static Hosting

The project is configured for static export (`output: 'export'`). The `dist/` folder can be deployed to any static host (Cloudflare Pages, Netlify, GitHub Pages, etc.).

## License

MIT
