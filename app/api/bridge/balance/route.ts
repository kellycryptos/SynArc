import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, fallback, parseAbi, formatUnits, getAddress, isAddress } from "viem";
import { mainnet, base, avalanche, sepolia, baseSepolia, avalancheFuji } from "viem/chains";
import { arcMainnet, arcTestnet, ARC_MAINNET_RPC_URLS, ARC_TESTNET_RPC_URLS } from "@/lib/arc-config";

// ERC20 balanceOf ABI
const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

interface ChainBalanceConfig {
  chain: any;
  tokenAddress: string;
  eurcAddress?: string;
  rpcUrls: string[];
  isArc?: boolean;
}

const SUPPORTED_CHAINS: Record<number, ChainBalanceConfig> = {
  // Ethereum Mainnet
  1: {
    chain: mainnet,
    tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    eurcAddress: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
    rpcUrls: [
      "https://ethereum-rpc.publicnode.com",
      "https://eth.drpc.org",
      "https://1rpc.io/eth",
    ],
  },
  // Base Mainnet
  8453: {
    chain: base,
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    eurcAddress: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    rpcUrls: [
      "https://mainnet.base.org",
      "https://base-rpc.publicnode.com",
      "https://base.gateway.tenderly.co",
      "https://1rpc.io/base",
    ],
  },
  // Avalanche C-Chain Mainnet
  43114: {
    chain: avalanche,
    tokenAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    eurcAddress: "0xC891EB4cbdEFf6e073e859e987815Ed1505c2ACD",
    rpcUrls: [
      "https://api.avax.network/ext/bc/C/rpc",
      "https://avalanche-c-chain-rpc.publicnode.com",
      "https://1rpc.io/avax/c",
    ],
  },
  // Ethereum Sepolia
  11155111: {
    chain: sepolia,
    tokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    eurcAddress: "0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4",
    rpcUrls: [
      "https://ethereum-sepolia-rpc.publicnode.com",
      "https://sepolia.drpc.org",
      "https://1rpc.io/sepolia",
    ],
  },
  // Base Sepolia
  84532: {
    chain: baseSepolia,
    tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    eurcAddress: "0x808456652fdb597867f38412077A9182bf77359F",
    rpcUrls: [
      "https://base-sepolia.drpc.org",
      "https://sepolia.base.org",
      "https://base-sepolia-rpc.publicnode.com",
    ],
  },
  // Avalanche Fuji
  43113: {
    chain: avalancheFuji,
    tokenAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
    eurcAddress: "0x5E44db7996c682E92a960b65AC713a54AD815c6B",
    rpcUrls: [
      "https://api.avax-test.network/ext/bc/C/rpc",
      "https://avalanche-fuji-c-chain-rpc.publicnode.com",
    ],
  },
  // Arc Mainnet
  5042: {
    chain: arcMainnet,
    tokenAddress: "0x3600000000000000000000000000000000000000",
    eurcAddress: "0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1",
    rpcUrls: ARC_MAINNET_RPC_URLS,
    isArc: true,
  },
  // Arc Testnet
  5042002: {
    chain: arcTestnet,
    tokenAddress: "0x3600000000000000000000000000000000000000",
    eurcAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    rpcUrls: ARC_TESTNET_RPC_URLS,
    isArc: true,
  },
};

// Map chain identifiers (string id) to numeric chainId
const CHAIN_ID_MAP: Record<string, number> = {
  ETH_MAINNET: 1,
  ETHEREUM: 1,
  BASE_MAINNET: 8453,
  BASE: 8453,
  AVAX_MAINNET: 43114,
  AVALANCHE: 43114,
  ETH_SEPOLIA: 11155111,
  SEPOLIA: 11155111,
  BASE_SEPOLIA: 84532,
  AVAX_FUJI: 43113,
  ARC_MAINNET: 5042,
  ARC: 5042,
  ARC_TESTNET: 5042002,
};

// In-memory cache to prevent hammering RPCs
interface CacheEntry {
  balance: string;
  raw: string;
  decimals: number;
  timestamp: number;
}
const balanceCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 6000; // 6 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const chainParam = searchParams.get("chainId") || searchParams.get("chain");
    const tokenParam = (searchParams.get("token") || searchParams.get("symbol") || "USDC").toUpperCase();
    const isEurc = tokenParam === "EURC";

    if (!address) {
      return NextResponse.json({ success: false, error: "Missing address" }, { status: 400 });
    }

    if (!chainParam) {
      return NextResponse.json({ success: false, error: "Missing chainId or chain" }, { status: 400 });
    }

    let parsedAddress: `0x${string}`;
    try {
      if (!isAddress(address)) {
        return NextResponse.json({ success: false, error: "Invalid Ethereum address" }, { status: 400 });
      }
      parsedAddress = getAddress(address.toLowerCase());
    } catch {
      return NextResponse.json({ success: false, error: "Invalid address format" }, { status: 400 });
    }

    let targetChainId: number | undefined;
    const numId = parseInt(chainParam, 10);
    if (!isNaN(numId) && SUPPORTED_CHAINS[numId]) {
      targetChainId = numId;
    } else if (CHAIN_ID_MAP[chainParam.toUpperCase()]) {
      targetChainId = CHAIN_ID_MAP[chainParam.toUpperCase()];
    }

    if (!targetChainId || !SUPPORTED_CHAINS[targetChainId]) {
      return NextResponse.json({ success: false, error: `Unsupported chain: ${chainParam}` }, { status: 400 });
    }

    const config = SUPPORTED_CHAINS[targetChainId];
    const targetTokenAddress = isEurc ? (config.eurcAddress || config.tokenAddress) : config.tokenAddress;
    const cacheKey = `${parsedAddress.toLowerCase()}_${targetChainId}_${tokenParam}`;
    const now = Date.now();

    // Check cache
    const cached = balanceCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        chainId: targetChainId,
        chainName: config.chain.name,
        token: tokenParam,
        balance: cached.balance,
        raw: cached.raw,
        decimals: cached.decimals,
        cached: true,
      });
    }

    // Build resilient client
    const client = createPublicClient({
      chain: config.chain,
      transport: fallback(
        config.rpcUrls.map((url) => http(url, { timeout: 6000, retryCount: 2 }))
      ),
    });

    let rawBalance = 0n;
    const decimals = 6;

    if (config.isArc && !isEurc) {
      // Arc USDC: check both ERC20 and Native USDC gas balance
      const [erc20Result, nativeResult] = await Promise.allSettled([
        client.readContract({
          address: getAddress(config.tokenAddress),
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [parsedAddress],
        }),
        client.getBalance({ address: parsedAddress }),
      ]);

      const erc20Raw = erc20Result.status === "fulfilled" ? erc20Result.value : 0n;
      const nativeRaw = nativeResult.status === "fulfilled" ? nativeResult.value : 0n;

      const erc20Num = Number(formatUnits(erc20Raw, 6));
      const nativeNum = Number(formatUnits(nativeRaw, 18));
      const maxVal = Math.max(erc20Num, nativeNum);

      const formatted = maxVal.toString();
      rawBalance = erc20Raw > 0n ? erc20Raw : BigInt(Math.floor(maxVal * 1e6));

      balanceCache.set(cacheKey, {
        balance: formatted,
        raw: rawBalance.toString(),
        decimals,
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        chainId: targetChainId,
        chainName: config.chain.name,
        token: tokenParam,
        balance: formatted,
        raw: rawBalance.toString(),
        decimals,
      });
    } else {
      // Standard ERC20 reads (including EURC on Arc and all external chains)
      rawBalance = await client.readContract({
        address: getAddress(targetTokenAddress),
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [parsedAddress],
      });

      const formatted = formatUnits(rawBalance, decimals);

      balanceCache.set(cacheKey, {
        balance: formatted,
        raw: rawBalance.toString(),
        decimals,
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        chainId: targetChainId,
        chainName: config.chain.name,
        token: tokenParam,
        balance: formatted,
        raw: rawBalance.toString(),
        decimals,
      });
    }
  } catch (error: any) {
    console.error("[api/bridge/balance] Error fetching balance:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch balance",
        balance: "0.00",
      },
      { status: 500 }
    );
  }
}
