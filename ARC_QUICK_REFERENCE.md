# Arc RPC Integration - Quick Reference

## What Was Done

✅ **Arc RPC infrastructure** - Personalized RPC endpoints with automatic fallback  
✅ **Environment configuration** - NEXT_PUBLIC_ARC_RPC_URL setup  
✅ **RPC health monitoring** - Real-time connection checking  
✅ **Network status UI** - Live latency indicator in navbar  
✅ **Developer documentation** - Comprehensive SETUP.md guide  
✅ **Production ready** - Vercel deployment optimized  

---

## Key Files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variable template (NEXT_PUBLIC_ARC_RPC_URL) |
| `lib/rpc/config.ts` | RPC URL management and fallback logic |
| `lib/rpc/health.ts` | RPC health checking utilities |
| `lib/chains/arc.ts` | Arc Testnet chain configuration |
| `lib/wagmi/config.ts` | WAGMI blockchain provider setup |
| `lib/hooks/useRpcStatus.ts` | React hook for RPC status monitoring |
| `components/layout/NetworkStatusBadge.tsx` | Network status UI component |
| `SETUP.md` | Complete developer setup guide |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (if not already done)
# Already set in .env.local:
# NEXT_PUBLIC_PRIVY_APP_ID=clt57262n00ldmp0fhz113qep
# NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network

# 3. (Optional) Get personalized Arc RPC
arc-canteen login
arc-canteen rpc-url
# Add result to .env.local as NEXT_PUBLIC_ARC_RPC_URL

# 4. Start development
npm run dev
```

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_PRIVY_APP_ID="clt57262n00ldmp0fhz113qep"

# Optional (defaults to public RPC)
NEXT_PUBLIC_ARC_RPC_URL="https://your-personalized-rpc.com"

# Optional
NEXT_PUBLIC_ENVIRONMENT="development"
```

---

## ARC CLI Setup

```bash
# Install
uv tool install git+https://github.com/the-canteen-dev/ARC-cli.git

# Authenticate
arc-canteen login

# Get your personalized RPC
arc-canteen rpc-url

# Sync governance context
arc-canteen context sync
```

---

## Usage in Components

### Monitor RPC Health
```typescript
import { useRpcStatus } from '@/lib/hooks/useRpcStatus';

export function MyComponent() {
  const { isHealthy, latency, message } = useRpcStatus();
  return <div>{isHealthy ? `${latency}ms` : 'Disconnected'}</div>;
}
```

### Monitor Network Status
```typescript
import { useNetworkStatus } from '@/lib/hooks/useRpcStatus';

export function MyComponent() {
  const { isOnline, isRpcHealthy, isConnected } = useNetworkStatus();
  return <div>{isConnected ? 'Connected' : 'No connection'}</div>;
}
```

### Get Current RPC URL
```typescript
import { useArcRpcUrl } from '@/lib/hooks/useRpcStatus';

export function MyComponent() {
  const rpcUrl = useArcRpcUrl();
  return <div>Using: {rpcUrl}</div>;
}
```

---

## Deployment

### Vercel
1. Add environment variables to Vercel dashboard
2. Deploy: `git push origin main`
3. Verify build succeeds

### Production Checklist
- ✅ NEXT_PUBLIC_PRIVY_APP_ID configured
- ✅ NEXT_PUBLIC_ARC_RPC_URL set (optional)
- ✅ NEXT_PUBLIC_ENVIRONMENT=production
- ✅ Build: `npm run build` succeeds
- ✅ No console errors on production

---

## Arc Testnet Info

- **Chain ID**: 5042002
- **Currency**: USDC (18 decimals)
- **Public RPC**: https://rpc.testnet.arc.network
- **Explorer**: https://testnet.arcscan.app

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Arc RPC: Disconnected" | Check internet, verify NEXT_PUBLIC_ARC_RPC_URL |
| "Privy not configured" | Add NEXT_PUBLIC_PRIVY_APP_ID to .env.local |
| Build fails | Run `npm run build` locally, check TypeScript errors |
| Hydration mismatch | Clear `.next`, restart dev server |

---

## More Info

📖 **Full guide**: Read `SETUP.md` in project root  
🚀 **Deploy**: Follow Vercel instructions in SETUP.md  
🐛 **Troubleshoot**: See Troubleshooting section in SETUP.md  

---

**Ready to develop Arc governance with SynArc!** 🎉
