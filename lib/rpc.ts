import { 
  ARC_TESTNET_RPC_URLS, 
  ARC_MAINNET_RPC_URLS, 
  getActiveNetwork, 
  getMainnetRpcUrls, 
  getTestnetRpcUrls, 
  arcTestnet, 
  arcMainnet 
} from '@/lib/arc-config';

export const getWorkingRPC = async (): Promise<string> => {
  const currentNet = getActiveNetwork();
  const urls = currentNet === 'mainnet' ? getMainnetRpcUrls() : getTestnetRpcUrls();
  const primaryFallback = urls[0] || (currentNet === 'mainnet' ? 'https://rpc.mainnet.arc.io' : 'https://rpc.testnet.arc.io');

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        }),
        signal: AbortSignal.timeout(2500)
      });
      const data = await res.json();
      if (data.result) return url;
    } catch {
      continue;
    }
  }
  return primaryFallback;
};

export const arcTestnetChain = arcTestnet;
export const arcMainnetChain = arcMainnet;
