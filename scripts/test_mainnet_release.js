const fs = require('fs');
const dotenv = require('dotenv');
const {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  keccak256,
  toHex,
  encodePacked,
  formatUnits,
  formatEther
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } }
});

let key = (process.env.AGENT_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || '').trim();
if (key.startsWith('"') || key.startsWith("'")) key = key.slice(1, -1);
if (!key.startsWith('0x')) key = '0x' + key;

const account = privateKeyToAccount(key);
console.log('Using Agent/Deployer account:', account.address);

const client = createPublicClient({ chain: arcMainnet, transport: http('https://rpc.mainnet.arc.io') });
const wallet = createWalletClient({ account, chain: arcMainnet, transport: http('https://rpc.mainnet.arc.io') });

const TREASURY_ADDRESS = '0x8205e9782Fe54fD2aaD895b436B695db169F3d7B';
const CONTRACTOR_PAYEE = '0x7f67D351Cc3A6e9695c0B8AA6DE2bE5Ce58b3d73';

const TREASURY_ABI = parseAbi([
  'function registerOrder(uint256 proposalId, uint256 milestoneId, address recipient, uint256 amount, bytes32 expectedDocumentHash, string deliverableURI)',
  'function releaseMilestone(uint256 proposalId, uint256 milestoneId, bytes32 documentHash, bytes32 invoiceHash, address recipient, uint256 amount, uint8 aiConfidenceScore)',
  'function usdcBalance() view returns (uint256)',
  'function registeredOrders(bytes32) view returns (uint256 proposalId, uint256 milestoneId, address recipient, uint256 amount, bytes32 expectedDocumentHash, string deliverableURI, bool exists)'
]);

async function main() {
  const proposalId = BigInt(Math.floor(Date.now() / 1000)); // Unique proposal timestamp ID
  const milestoneId = 1n;
  const deliverableCID = 'ipfs://QmPgvwkpDNgHSTx3V7NrLwCrQbppN39Zpji6o3TwbtVuiU';
  const docHash = keccak256(toHex(deliverableCID));
  const invoiceHash = keccak256(toHex(`INV-${proposalId}-1`));
  const payoutAmount = 10000n; // 0.01 USDC (6 decimals)
  const aiScore = 88;

  console.log(`\n--- Registering Order on Arc Mainnet for Proposal #${proposalId} ---`);
  const regTx = await wallet.writeContract({
    address: TREASURY_ADDRESS,
    abi: TREASURY_ABI,
    functionName: 'registerOrder',
    args: [
      proposalId,
      milestoneId,
      CONTRACTOR_PAYEE,
      payoutAmount,
      docHash,
      deliverableCID
    ],
    gas: 300000n,
    gasPrice: 10000000n
  });
  console.log('Order Registration Tx:', regTx);
  const regReceipt = await client.waitForTransactionReceipt({ hash: regTx });
  console.log(`✅ Order registered in block ${regReceipt.blockNumber}!`);

  console.log(`\n--- Executing releaseMilestone on Arc Mainnet ---`);
  const releaseTx = await wallet.writeContract({
    address: TREASURY_ADDRESS,
    abi: TREASURY_ABI,
    functionName: 'releaseMilestone',
    args: [
      proposalId,
      milestoneId,
      docHash,
      invoiceHash,
      CONTRACTOR_PAYEE,
      payoutAmount,
      aiScore
    ],
    gas: 350000n,
    gasPrice: 10000000n
  });

  console.log('Release Tx broadcast:', releaseTx);
  const relReceipt = await client.waitForTransactionReceipt({ hash: releaseTx });
  console.log(`🎉 RELEASE CONFIRMED in block ${relReceipt.blockNumber}!`);
  console.log(`🔗 Arc Explorer Link: https://explorer.arc.io/tx/${releaseTx}`);

  const contractorBal = await client.getBalance({ address: CONTRACTOR_PAYEE });
  console.log(`Contractor New Native Balance: ${formatEther(contractorBal)} USDC`);
}

main().catch(console.error);
