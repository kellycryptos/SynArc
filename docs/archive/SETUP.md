# SynArc Arc RPC Integration & Setup Guide

Welcome to SynArc! This guide explains the Arc-native infrastructure, RPC configuration, and ARC CLI integration.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Arc-Native Infrastructure](#arc-native-infrastructure)
3. [ARC CLI Integration](#arc-cli-integration)
4. [Environment Configuration](#environment-configuration)
5. [RPC Configuration](#rpc-configuration)
6. [Development](#development)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Privy account (for authentication)
- ARC CLI (optional, for personalized RPC)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your Privy App ID (required)
# Edit .env.local and add NEXT_PUBLIC_PRIVY_APP_ID

# Optional: Add personalized Arc RPC endpoint
# arc-canteen rpc-url  # Run this to get your personalized RPC
# Then add NEXT_PUBLIC_ARC_RPC_URL=<your-rpc-url> to .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Arc-Native Infrastructure

### What is Arc?

Arc is a stablecoin-native blockchain designed for:
- **Programmable Governance**: Smart contracts that coordinate governance decisions
- **Agentic Economy Coordination**: Agents participating in governance and treasury management
- **Cross-chain Interoperability**: Secure value transfer and coordination
- **USDC as Native Currency**: All transactions use USDC stablecoins

### SynArc's Role

SynArc is a **private governance infrastructure platform** built on Arc that enables:
- **DAO Coordination**: Secure proposal voting and execution
- **Treasury Management**: Governance-controlled fund allocation
- **Delegate Reputation**: Track and reward delegate participation
- **Encrypted Analytics**: Private governance insights and trends
- **On-chain Participation**: Direct blockchain interaction via embedded wallets

### Arc Testnet

All development happens on **Arc Testnet** (Chain ID: `5042002`):
- **Block Explorer**: https://testnet.arcscan.app
- **Public RPC**: https://rpc.testnet.arc.network
- **Currency**: USDC (18 decimals)

---

## ARC CLI Integration

### What is ARC CLI?

The ARC CLI (`arc-canteen`) provides tools for:
- **Authentication**: `arc-canteen login`
- **RPC Management**: `arc-canteen rpc-url` (get personalized RPC endpoint)
- **Context Sync**: `arc-canteen context sync` (sync governance state)

### Installation

```bash
# Install ARC CLI globally
uv tool install git+https://github.com/the-canteen-dev/ARC-cli.git

# Verify installation
arc-canteen --version
```

### Getting Your Personalized RPC

1. **Authenticate**:
   ```bash
   arc-canteen login
   ```
   This opens a browser window for you to sign in with your wallet.

2. **Get RPC Endpoint**:
   ```bash
   arc-canteen rpc-url
   ```
   This returns your personalized Arc RPC endpoint. Copy it.

3. **Add to SynArc**:
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_ARC_RPC_URL=<your-personalized-rpc-url>
   
   # Restart development server
   npm run dev
   ```

### Syncing Arc Context

Before deploying governance contracts or proposals:

```bash
arc-canteen context sync
```

This updates your local Arc governance context with:
- Current governance parameters
- Active proposals
- Delegate information
- Treasury state

---

## Environment Configuration

### Required Variables

Create `.env.local` with these variables:

```env
# Privy Authentication (required)
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"

# Arc RPC Configuration (optional, fallback to public RPC)
NEXT_PUBLIC_ARC_RPC_URL="https://your-personalized-arc-rpc.com"

# Environment (optional, defaults to 'development')
NEXT_PUBLIC_ENVIRONMENT="development"
```

### Variable Reference

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | ✅ Yes | None | Privy authentication app ID |
| `NEXT_PUBLIC_ARC_RPC_URL` | ❌ No | Public RPC | Personalized Arc RPC endpoint |
| `NEXT_PUBLIC_ENVIRONMENT` | ❌ No | `development` | Environment mode |
| `PRIVY_APP_SECRET` | ❌ No | None | Privy webhook secret (server-only) |

### Never Commit Secrets

**Important**: `.env.local` is git-ignored. Secrets are never committed:

```bash
# ✅ Good - these stay in .env.local (not committed)
NEXT_PUBLIC_PRIVY_APP_ID=clt57262n00ldmp0fhz113qep

# ❌ Bad - never add secrets to .env.example or code
NEXT_PUBLIC_PRIVY_APP_ID=your-secret-here
```

---

## RPC Configuration

### Fallback Strategy

SynArc uses a smart RPC fallback strategy:

```
Primary: NEXT_PUBLIC_ARC_RPC_URL (personalized from ARC CLI)
         ↓ (if unavailable)
Fallback: https://rpc.testnet.arc.network (public Arc RPC)
```

### Configuration Files

#### `lib/rpc/config.ts` - RPC URL Management
```typescript
import { getArcRpcUrl, getArcRpcFallback } from '@/lib/rpc/config';

const primaryRpc = getArcRpcUrl();      // Your personalized RPC
const fallbackRpc = getArcRpcFallback(); // Public Arc testnet RPC
```

#### `lib/rpc/health.ts` - RPC Health Checking
```typescript
import { checkRpcHealth, findHealthyRpc } from '@/lib/rpc/health';

// Check if RPC is responsive
const status = await checkRpcHealth(rpcUrl);

// Find first healthy RPC from multiple options
const activeRpc = await findHealthyRpc([rpc1, rpc2, rpc3]);
```

#### `lib/chains/arc.ts` - Arc Chain Definition
```typescript
import { arcTestnet } from '@/lib/chains/arc';

// Arc chain configured with personalized RPC
// Uses automatic fallback if primary fails
```

#### `lib/wagmi/config.ts` - WAGMI Setup
```typescript
import { config } from '@/lib/wagmi/config';

// WAGMI configured to use Arc RPC with fallback
// Safe for SSR in Next.js App Router
```

### RPC Health Monitoring

SynArc automatically monitors RPC health and displays status in the navbar:

```typescript
import { useRpcStatus } from '@/lib/hooks/useRpcStatus';

export function MyComponent() {
  const { isHealthy, latency, message } = useRpcStatus();
  
  return (
    <div>
      {isHealthy 
        ? `Connected (${latency}ms)`
        : 'Reconnecting...'
      }
    </div>
  );
}
```

---

## Development

### File Structure

```
lib/
├── chains/              # Chain definitions
│   └── arc.ts          # Arc Testnet configuration
├── rpc/                # RPC utilities
│   ├── config.ts       # RPC URL management
│   └── health.ts       # RPC health checking
├── hooks/              # Custom React hooks
│   └── useRpcStatus.ts # RPC status monitoring hook
├── wagmi/              # WAGMI configuration
│   └── config.ts       # WAGMI & Privy setup
└── privy/              # Privy configuration
    └── config.ts       # Privy auth & wallet setup

providers/
├── Web3Provider.tsx    # Web3 provider wrapper
└── ThemeProvider.tsx   # Theme provider

components/
├── layout/
│   └── NetworkStatusBadge.tsx  # RPC status indicator
└── navbar/
    └── DashboardNavbar.tsx     # Uses network status badge
```

### Common Tasks

#### Use Arc Testnet in a Component

```typescript
import { useChainId } from 'wagmi';

export function MyComponent() {
  const chainId = useChainId();
  
  if (chainId !== 5042002) {
    return <div>Please switch to Arc Testnet</div>;
  }
  
  return <div>Connected to Arc Testnet!</div>;
}
```

#### Check RPC Health

```typescript
import { useRpcStatus } from '@/lib/hooks/useRpcStatus';

export function RpcStatusIndicator() {
  const { isHealthy, latency, message } = useRpcStatus();
  
  return (
    <div title={message}>
      {isHealthy ? `${latency}ms` : 'Reconnecting...'}
    </div>
  );
}
```

#### Call Arc Smart Contracts

```typescript
import { useContractRead } from 'wagmi';
import { arcTestnet } from '@/lib/chains/arc';

export function ReadContract() {
  const { data } = useContractRead({
    chainId: arcTestnet.id,
    address: '0x...',
    abi: CONTRACT_ABI,
    functionName: 'yourFunction',
  });
  
  return <div>{data}</div>;
}
```

#### Access User's Wallet

```typescript
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';

export function UserProfile() {
  const { user } = usePrivy();
  const { address, isConnected } = useAccount();
  
  return (
    <div>
      {isConnected && <span>Connected: {address}</span>}
      {user?.email && <span>Email: {user.email}</span>}
    </div>
  );
}
```

---

## Deployment

### Vercel Deployment

SynArc is optimized for Vercel deployment:

1. **Environment Variables**:
   ```bash
   # Add to Vercel project settings > Environment Variables
   NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
   NEXT_PUBLIC_ARC_RPC_URL=your-personalized-rpc-url (optional)
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Deploy**:
   ```bash
   git push origin main  # Automatically triggers Vercel deployment
   ```

### Production Checklist

- ✅ `NEXT_PUBLIC_PRIVY_APP_ID` is set
- ✅ No secrets in `.env.example` or code
- ✅ `.env.local` is in `.gitignore`
- ✅ Personalized `NEXT_PUBLIC_ARC_RPC_URL` configured (optional but recommended)
- ✅ `NEXT_PUBLIC_ENVIRONMENT=production`
- ✅ Build succeeds: `npm run build`
- ✅ No hydration errors in console
- ✅ Network status badge displays correctly

### Production Arc Network

For mainnet deployment, update:

```typescript
// lib/chains/arc.ts (future production)
export const arcMainnet = defineChain({
  id: 5041000, // Mainnet ID
  name: "Arc Mainnet",
  rpcUrls: {
    default: { http: [getArcMainnetRpc()] }
  },
  // ... other config
});
```

---

## Troubleshooting

### "Failed to connect to RPC"

**Solution**: Check your environment variables:
```bash
# Check if variables are loaded
echo $NEXT_PUBLIC_ARC_RPC_URL
echo $NEXT_PUBLIC_PRIVY_APP_ID

# Restart dev server
npm run dev
```

### "Hydration mismatch errors"

**Cause**: WAGMI config has `ssr: true` which is correct. If you see hydration errors:

**Solution**:
```bash
# Clear Next.js cache and restart
rm -rf .next node_modules
npm install
npm run dev
```

### "Arc RPC: Disconnected" in Navbar

**Cause**: Primary RPC is unavailable.

**Solution**:
1. Check internet connection
2. Verify NEXT_PUBLIC_ARC_RPC_URL is valid
3. SynArc automatically falls back to public RPC
4. Check Arc network status: https://testnet.arcscan.app

### "Can't find NEXT_PUBLIC_PRIVY_APP_ID"

**Cause**: Missing environment variable.

**Solution**:
1. Get your Privy App ID from https://dashboard.privy.io
2. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your-app-id
   ```
3. Restart dev server: `npm run dev`

### "ARC CLI: command not found"

**Cause**: ARC CLI not installed or not in PATH.

**Solution**:
```bash
# Install ARC CLI
uv tool install git+https://github.com/the-canteen-dev/ARC-cli.git

# Verify
arc-canteen --version

# If still not found, add to PATH or use full path
~/.cargo/bin/arc-canteen --version
```

### "Vercel Build Failed"

**Cause**: Missing environment variables or build errors.

**Solution**:
1. Check Vercel environment variables are set
2. Run local build: `npm run build`
3. Check for TypeScript errors: `npx tsc --noEmit`
4. Review Vercel build logs for specific errors

---

## Support

### Resources

- **SynArc Codebase**: `/app` and `/components`
- **Arc Network**: https://arc-node.thecanteenapp.com
- **Arc Testnet Explorer**: https://testnet.arcscan.app
- **Privy Docs**: https://docs.privy.io
- **WAGMI Docs**: https://wagmi.sh

### Getting Help

1. Check this guide first
2. Review error messages in browser console
3. Check Vercel build logs
4. Inspect NEXT_PUBLIC_* environment variables
5. Verify ARC CLI is properly installed

---

## Advanced

### Custom RPC Configuration

For advanced use cases, modify `lib/rpc/config.ts`:

```typescript
// Add custom RPC validation
export function validateArcRpc(url: string): boolean {
  // Your validation logic
}

// Add custom fallback logic
export function getSmartFallbackRpc(): string {
  // Your fallback logic
}
```

### Monitoring RPC Performance

Use the health checking utilities for performance monitoring:

```typescript
import { checkMultipleRpcHealth } from '@/lib/rpc/health';

const rpcs = ['rpc1', 'rpc2', 'rpc3'];
const results = await checkMultipleRpcHealth(rpcs);

console.log('RPC Performance:', results);
// Results sorted by health then latency
```

### Extending Network Status

Create custom network status indicators:

```typescript
import { useNetworkStatus } from '@/lib/hooks/useRpcStatus';

export function CustomNetworkStatus() {
  const { isOnline, isRpcHealthy, isConnected } = useNetworkStatus();
  
  return (
    <div>
      {!isOnline && <div>No internet connection</div>}
      {!isRpcHealthy && <div>RPC unavailable</div>}
      {isConnected && <div>Fully connected!</div>}
    </div>
  );
}
```

---

## Next Steps

1. ✅ Complete Quick Start above
2. ⬜ Get personalized Arc RPC via ARC CLI
3. ⬜ Connect your wallet (Privy)
4. ⬜ Create your first governance proposal
5. ⬜ Deploy to Vercel when ready

Happy governing! 🚀

---

**Last Updated**: May 2026  
**SynArc Version**: 0.1.0  
**Arc Network Testnet**: Active
