import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arcTestnet } from '@/lib/chains/arc';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '82c0f2095f9c5d123dbb77de568be3ad'; // safe fallback ID

export const config = getDefaultConfig({
  appName: 'SynArc',
  projectId,
  chains: [arcTestnet],
  ssr: true,
});
