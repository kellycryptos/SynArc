import { createPublicClient, http, fallback } from "viem";
import { arcMainnet } from "../lib/arc-config";

const TREASURY_ABI_6 = [
  {
    name: 'getTransactions',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        name: '',
        components: [
          { name: 'txType', type: 'string' },
          { name: 'party', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'tokenSymbol', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
  },
] as const;

const TREASURY_ABI_7 = [
  {
    name: 'getTransactions',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[]',
        name: '',
        components: [
          { name: 'txType', type: 'string' },
          { name: 'party', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'tokenSymbol', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'deliverableURI', type: 'string' },
        ],
      },
    ],
  },
] as const;

async function testViem() {
  const client = createPublicClient({
    chain: arcMainnet,
    transport: http('https://rpc.mainnet.arc.io')
  });

  const treasuryAddress = '0x8205e9782Fe54fD2aaD895b436B695db169F3d7B';
  console.log("Calling getTransactions with ABI_6...");
  try {
    const res6 = await client.readContract({
      address: treasuryAddress,
      abi: TREASURY_ABI_6,
      functionName: 'getTransactions',
    });
    console.log("ABI_6 succeeded! Length:", (res6 as any).length);
  } catch (err: any) {
    console.log("ABI_6 failed:", err.message);
  }

  console.log("Calling getTransactions with ABI_7...");
  try {
    const res7 = await client.readContract({
      address: treasuryAddress,
      abi: TREASURY_ABI_7,
      functionName: 'getTransactions',
    });
    console.log("ABI_7 succeeded! Length:", (res7 as any).length);
    console.log("Sample tx:", res7);
  } catch (err: any) {
    console.log("ABI_7 failed:", err.message);
  }
}

testViem().catch(console.error);
