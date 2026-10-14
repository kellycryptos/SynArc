import fs from 'fs';
import dotenv from 'dotenv';
import { createPublicClient, http, formatEther } from 'viem';
import { defineChain } from 'viem';
import { releaseEngine } from '../lib/agent/release-engine';

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
if (fs.existsSync('.env')) dotenv.config({ path: '.env' });

const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } }
});

const client = createPublicClient({ chain: arcMainnet, transport: http('https://rpc.mainnet.arc.io') });
const RECIPIENT = '0x1BDA1797E1839861C1CF539359246e2bb77c8E53';
const TREASURY = '0x8205e9782Fe54fD2aaD895b436B695db169F3d7B';

async function main() {
  console.log('========================================================================');
  console.log('🤖 SYNARC AUTONOMOUS AGENT MAINNET PAYOUT TRIGGER');
  console.log('========================================================================');

  const balBefore = await client.getBalance({ address: RECIPIENT });
  const trBefore = await client.getBalance({ address: TREASURY });
  console.log(`Recipient Balance BEFORE: ${formatEther(balBefore)} USDC`);
  console.log(`Treasury Balance BEFORE:  ${formatEther(trBefore)} USDC`);
  console.log(`Target Payee Address:     ${RECIPIENT}`);
  console.log(`Payout Amount:            0.05 USDC\n`);

  const proposalId = Math.floor(Date.now() / 1000);
  console.log(`[Agent] Initiating Release Check for Proposal SIP-${proposalId}...`);

  const result = await releaseEngine.runReleaseCheck({
    proposalId,
    proposalTitle: 'Landing page design & smart contract review',
    proposalDescription: 'Milestone 1 payout for UI landing page design delivery and smart contract security audit review.',
    deliverableCID: 'invoice.txt',
    payeeAddress: RECIPIENT,
    amount: 0.05,
  });

  console.log('\n========================================================================');
  console.log('DECISION REPORT:');
  console.log('========================================================================');
  console.log('Should Release:  ', result.decision.shouldRelease);
  console.log('Score:           ', `${result.decision.score}/100`);
  console.log('Reasoning:       ', result.decision.reasoning);

  if (result.refused) {
    console.error('❌ RELEASE REFUSED:', result.refusalReason);
    process.exit(1);
  }

  console.log('\n========================================================================');
  console.log('🎉 TRANSACTION BROADCAST & CONFIRMED ON ARC MAINNET!');
  console.log('========================================================================');
  console.log('TX Hash:      ', result.txHash);
  console.log('Explorer URL: ', result.explorerUrl);

  const balAfter = await client.getBalance({ address: RECIPIENT });
  const trAfter = await client.getBalance({ address: TREASURY });
  console.log(`\nRecipient Balance AFTER:  ${formatEther(balAfter)} USDC (+0.05 USDC received!)`);
  console.log(`Treasury Balance AFTER:   ${formatEther(trAfter)} USDC`);
}

main().catch(console.error);
