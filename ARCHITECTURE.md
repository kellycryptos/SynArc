# Arc RPC Integration Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      SynArc Governance Platform                 │
│              Arc-Native Stablecoin DAO Infrastructure           │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Privy Auth      │
                    │ (Embedded Wallet) │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
        ▼                                            ▼
┌───────────────────┐                      ┌─────────────────────┐
│  Social Login     │                      │  Wallet Connect     │
│  (Google/Twitter) │                      │  (Direct Web3)      │
└───────────────────┘                      └─────────────────────┘
        │                                            │
        └─────────────────────┬──────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  WAGMI Config     │
                    │  (Web3 Library)   │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
        ▼                                            ▼
┌──────────────────────────┐            ┌──────────────────────────┐
│  Personalized Arc RPC    │            │  Public Arc Testnet RPC  │
│  (From arc-canteen)      │            │  (Fallback)              │
│  NEXT_PUBLIC_ARC_RPC_URL │            │  rpc.testnet.arc.network │
│  ✅ Low latency          │            │  ✅ Always available     │
│  ✅ Performance optimized│            │  ✅ Public access        │
└──────────────────────────┘            └──────────────────────────┘
        │                                            │
        │                    ▲                       │
        │         ┌──────────┴────────────┐         │
        │         │  RPC Health Check     │         │
        │         │  (checkRpcHealth)     │         │
        │         │  Every 30 seconds     │         │
        │         └──────────┬────────────┘         │
        │                    │                      │
        └────────────────────┼──────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Arc Testnet         │
                  │  Chain ID: 5042002   │
                  │  Currency: USDC      │
                  │  Decimals: 18        │
                  └──────────┬───────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    ┌────────┐          ┌──────────┐        ┌──────────┐
    │ Voting │          │ Treasury │        │ Delegate │
    │ System │          │ Mgmt     │        │ Voting   │
    └────────┘          └──────────┘        └──────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                  ┌──────────▼──────────┐
                  │ Governance Contracts│
                  │ (Smart Contracts)   │
                  └─────────────────────┘
```

---

## RPC Routing Strategy

```
Request from SynArc App
        │
        ▼
Is Primary RPC configured?
        │
    ┌───┴───┐
    │       │
   YES     NO
    │       │
    ▼       └──────────────────┐
Check Primary Health           │
    │                          │
    ▼                          │
  Healthy?                     │
    │                          │
┌───┴────┐                     │
│        │                     │
YES    NO                      │
│        │                     │
│        └──────────────┐      │
│                       │      │
│        ┌──────────────┴──────┴──┐
│        │                         │
│        ▼                         ▼
│   Use Fallback RPC          Use Fallback RPC
│   (Public Arc Testnet)      (Public Arc Testnet)
│        │                         │
└────────┴─────────────────────────┘
                │
                ▼
        Send JSON-RPC Request
                │
                ▼
        Receive Response
                │
                ▼
        Update UI Status
     (Navbar shows latency)
```

---

## Component Architecture

```
┌─────────────────────────────────────────┐
│  app/layout.tsx                         │
│  (Root Provider Setup)                  │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────▼────────────┐
         │  Web3Provider        │
         │  (providers/)        │
         └─────────┬────────────┘
                   │
         ┌─────────▼────────────────┐
         │ PrivyProviderWrapper     │
         │ - Privy Setup           │
         │ - WAGMI Config          │
         │ - React Query           │
         └─────────┬────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
Dashboard      Proposals       Treasury
Layout         Page            Page
    │              │              │
    └──────────────┼──────────────┘
                   │
         ┌─────────▼──────────────┐
         │ DashboardNavbar        │
         │ - User Profile        │
         │ - USDC Balance        │
         │ - RPC Status Badge    │◄─ Uses useRpcStatus()
         └───────────────────────┘
                   │
         ┌─────────▼──────────────┐
         │ NetworkStatusBadge     │
         │ - Latency Display      │
         │ - Health Indicator     │
         │ - Connection Status    │
         └───────────────────────┘
```

---

## Hook Data Flow

```
useRpcStatus() Hook
    │
    ├─ Calls: checkRpcHealth(rpcUrl)
    │
    ├─ Using: lib/rpc/health.ts
    │         - eth_chainId JSON-RPC
    │         - 5 second timeout
    │         - Latency measurement
    │
    ├─ Updates: React Query cache
    │           (Every 30 seconds)
    │
    └─ Returns: {
        isHealthy,
        latency,
        message,
        status,
        isLoading,
        error
    }
    
    Used by:
    ├─ DashboardNavbar
    ├─ NetworkStatusBadge
    └─ Custom Components
```

---

## Environment Variable Flow

```
.env.local
    │
    ├─ NEXT_PUBLIC_PRIVY_APP_ID
    │      │
    │      └─▶ lib/privy/config.ts
    │           │
    │           └─▶ PrivyProvider
    │
    ├─ NEXT_PUBLIC_ARC_RPC_URL
    │      │
    │      └─▶ lib/rpc/config.ts (getArcRpcUrl)
    │           │
    │           └─▶ lib/chains/arc.ts
    │                │
    │                └─▶ lib/wagmi/config.ts
    │                     │
    │                     └─▶ WAGMI Provider
    │
    └─ NEXT_PUBLIC_ENVIRONMENT
           │
           └─▶ Feature flags and dev/prod logic
```

---

## File Dependency Graph

```
components/navbar/DashboardNavbar.tsx
    │
    ├─▶ lib/hooks/useRpcStatus.ts
    │   ├─▶ lib/rpc/health.ts
    │   │   └─▶ API calls to RPC endpoint
    │   └─▶ @tanstack/react-query
    │
    ├─▶ components/layout/NetworkStatusBadge.tsx
    │   └─▶ lib/hooks/useRpcStatus.ts
    │
    └─▶ providers/Web3Provider.tsx
        └─▶ components/providers/PrivyProviderWrapper.tsx
            ├─▶ lib/wagmi/config.ts
            │   ├─▶ lib/chains/arc.ts
            │   │   ├─▶ lib/rpc/config.ts
            │   │   └─▶ viem/defineChain
            │   └─▶ @privy-io/wagmi
            │
            ├─▶ lib/privy/config.ts
            │   └─▶ @privy-io/react-auth
            │
            └─▶ @tanstack/react-query
```

---

## Deployment Architecture

```
GitHub Repository
    │
    ├─ main branch (committed)
    │  ├─ Source code
    │  ├─ Configuration files
    │  └─ Documentation
    │
    └─ .env.local (NOT committed)
       ├─ NEXT_PUBLIC_PRIVY_APP_ID
       └─ NEXT_PUBLIC_ARC_RPC_URL
       
       │
       ├─ Push to GitHub
       │
       ▼
Vercel Deployment Pipeline
       │
       ├─ Pull environment variables
       │  from Vercel dashboard
       │
       ├─ npm install
       │
       ├─ npm run build
       │  ├─ TypeScript check
       │  ├─ Next.js build
       │  └─ Static generation
       │
       └─ Deploy to Edge Network
          ├─ CDN distribution
          ├─ Serverless functions
          └─ Global availability

       │
       ▼
Vercel Production URL
       │
       └─▶ Connected to Arc Testnet via RPC
```

---

## Security Model

```
Secrets Management
│
├─ Exposed (Never)
│  └─ PRIVY_APP_SECRET ❌
│  └─ Hardcoded URLs ❌
│  └─ API Keys in code ❌
│
├─ In Code (OK - Public)
│  ├─ Chain IDs ✅
│  ├─ Fallback RPC URLs ✅
│  ├─ Contract ABIs ✅
│  └─ RPC health check logic ✅
│
└─ In Environment (Protected)
   ├─ NEXT_PUBLIC_PRIVY_APP_ID ✅
   ├─ NEXT_PUBLIC_ARC_RPC_URL ✅
   └─ .env.local (never committed) ✅

Vercel Environment Variables
   ├─ Protected in dashboard ✅
   ├─ Not visible in logs ✅
   └─ Deployed securely ✅
```

---

This architecture provides a robust, scalable, and secure foundation for Arc-native governance coordination on the SynArc platform.
