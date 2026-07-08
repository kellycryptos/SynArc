import { createPublicClient, http, defineChain, getAddress, encodeDeployData } from 'viem';
import { SynArcCrowdfundABI, SynArcCrowdfundBytecode } from '../lib/governance/SynArcCrowdfund';

const CANTEEN_RPC = 'https://rpc.testnet.arc.network';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: [CANTEEN_RPC] },
    public: { http: [CANTEEN_RPC] }
  }
});

const client = createPublicClient({
  chain: arcTestnet,
  transport: http(CANTEEN_RPC)
});

async function run() {
  const cleanAddress = getAddress('0x4BDA3b78D0B3D55A1A86d4ec36d93339185c8E55');
  const cleanRecipient = getAddress('0x4BDA3b78D0B3D55A1A86d4ec36d93339185c8E55');
  const goalBigInt = BigInt(180 * 1_000_000);
  const creatorDuration = BigInt(42);
  const isAgent = false;
  const milestoneTitles = ["Initial Launch Phase"];
  const milestoneAmounts = [goalBigInt];
  const milestoneDescriptions = ["Release of initial backing capital to kickstart the project."];

  try {
    const deployData = encodeDeployData({
      abi: SynArcCrowdfundABI as any,
      bytecode: SynArcCrowdfundBytecode as `0x${string}`,
      args: [
        cleanAddress,
        cleanRecipient,
        USDC_ADDRESS,
        goalBigInt,
        creatorDuration,
        isAgent,
        "Kelly Music",
        "Fund my album or video",
        "music",
        milestoneTitles,
        milestoneAmounts,
        milestoneDescriptions
      ]
    });

    console.log('Deploy data size (bytes):', deployData.length / 2 - 1);

    const gasEstimate = await client.estimateGas({
      account: cleanAddress,
      data: deployData
    });
    console.log('Estimated Gas:', gasEstimate.toString());
  } catch (e: any) {
    console.log('Error estimating gas:', e.message);
  }
}

run();
