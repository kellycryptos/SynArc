import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const rpcUrl = process.env.ARC_RPC_URL || process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f";
const provider = new ethers.JsonRpcProvider(rpcUrl);
const GOVERNOR = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || "0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e";
const TOKEN    = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || "0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e";
const DEPLOYER = process.env.DEPLOYER_PRIVATE_KEY ? new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY).address : "0x35630dFE2592AB19d979ec1B173697aEa554b66b";

const govAbi = [
  "function proposalCount() view returns (uint256)",
  "function state(uint256) view returns (uint8)",
  "function executionDelay() view returns (uint256)",
  "function hasVoted(uint256, address) view returns (bool)",
  "function proposals(uint256) view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget, uint256 snapshotBlock)",
];
const tokenAbi = [
  "function getVotes(address) view returns (uint256)",
  "function getPastVotes(address, uint256) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function delegates(address) view returns (address)",
];

const gov   = new ethers.Contract(GOVERNOR, govAbi, provider);
const token = new ethers.Contract(TOKEN, tokenAbi, provider);
const stateNames = ["Pending","Active","Canceled","Defeated","Succeeded","Queued","Expired","Executed"];

const count  = await gov.proposalCount();
const delay  = await gov.executionDelay();
const block  = await provider.getBlockNumber();
const now    = Math.floor(Date.now() / 1000);

console.log(`\n=== SynArc Governor Diagnostics ===`);
console.log(`Proposal count : ${count}`);
console.log(`Execution delay: ${delay}s`);
console.log(`Current block  : ${block}`);
console.log(`Current time   : ${new Date(now * 1000).toISOString()}\n`);

// Token info for deployer
const bal      = await token.balanceOf(DEPLOYER);
const votes    = await token.getVotes(DEPLOYER);
const delegateTo = await token.delegates(DEPLOYER);
console.log(`=== Deployer Token State ===`);
console.log(`Balance        : ${ethers.formatUnits(bal, 18)} sARC`);
console.log(`getVotes       : ${ethers.formatUnits(votes, 18)} sARC`);
console.log(`Delegates to   : ${delegateTo}`);

for (let i = 1; i <= Number(count); i++) {
  const p = await gov.proposals(i);
  const s = await gov.state(i);
  const voted = await gov.hasVoted(i, DEPLOYER);

  let pastVotes = "N/A";
  try {
    const pv = await token.getPastVotes(DEPLOYER, p.snapshotBlock);
    pastVotes = ethers.formatUnits(pv, 18);
  } catch(e) { pastVotes = `ERROR: ${e.message}`; }

  console.log(`\n--- Proposal ${i}: "${p.title}" ---`);
  console.log(`  Proposer     : ${p.proposer}`);
  console.log(`  State        : ${stateNames[Number(s)]}`);
  console.log(`  startTime    : ${new Date(Number(p.startTime)*1000).toISOString()}`);
  console.log(`  endTime      : ${new Date(Number(p.endTime)*1000).toISOString()}`);
  console.log(`  Is active?   : ${now <= Number(p.endTime)}`);
  console.log(`  snapshotBlock: ${p.snapshotBlock}`);
  console.log(`  getPastVotes : ${pastVotes} sARC (deployer at snapshot)`);
  console.log(`  forVotes     : ${ethers.formatUnits(p.forVotes, 18)}`);
  console.log(`  againstVotes : ${ethers.formatUnits(p.againstVotes, 18)}`);
  console.log(`  hasVoted(deployer): ${voted}`);
}
