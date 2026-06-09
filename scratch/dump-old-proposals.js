const fs = require('fs');
const path = require('path');
const { JsonRpcProvider, Contract, formatUnits } = require('ethers');

const RPC_URL = 'https://rpc.quicknode.testnet.arc.network'; // Use QuickNode which is stable and has high limits
const GOVERNOR_ADDRESS = '0x17D9d585CBB1AF6aa4a3C787116f7ba59651B702';

const GOVERNOR_ABI = [
  "function proposalCount() external view returns (uint256)",
  "function getProposal(uint256 proposalId) external view returns (uint256 id, address proposer, string title, string description, string category, uint256 votingDuration, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool canceled, bool executed, uint256 treasuryImpactValue, address executionTarget)",
  "function state(uint256 proposalId) external view returns (uint8)"
];

const statusMap = {
  0: "Pending",
  1: "Active",
  2: "Canceled",
  3: "Defeated",
  4: "Succeeded",
  5: "Queued",
  6: "Expired",
  7: "Executed"
};

async function main() {
  const provider = new JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true, batchMaxCount: 1 });
  const governor = new Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, provider);

  try {
    const count = await governor.proposalCount();
    const totalCount = Number(count);
    console.log(`Historical Governor Proposal Count: ${totalCount}`);

    const loadedProposals = [];
    const batchSize = 15;

    for (let i = 1; i <= totalCount; i += batchSize) {
      const batchIndices = [];
      for (let j = i; j < i + batchSize && j <= totalCount; j++) {
        batchIndices.push(j);
      }

      console.log(`Fetching batch: indices ${batchIndices[0]} to ${batchIndices[batchIndices.length - 1]}...`);

      const batchResults = await Promise.all(
        batchIndices.map(async (id) => {
          let retries = 3;
          while (retries > 0) {
            try {
              const [p, stateNum] = await Promise.all([
                governor.getProposal(id),
                governor.state(id)
              ]);
              return { id, p, stateNum, success: true };
            } catch (err) {
              retries--;
              if (retries === 0) {
                console.error(`Failed to load proposal #${id} after retries:`, err.message);
                return { id, success: false, error: err.message };
              }
              await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
            }
          }
        })
      );

      for (const res of batchResults) {
        if (!res.success) continue;

        const { id, p, stateNum } = res;
        const forV = Number(formatUnits(p.forVotes, 18));
        const againstV = Number(formatUnits(p.againstVotes, 18));
        const abstainV = Number(formatUnits(p.abstainVotes, 18));
        const total = forV + againstV + abstainV;
        const participation = total > 0 ? (total / 15_000_000) * 100 : 0;
        const status = statusMap[Number(stateNum)] || "Ended";

        const timeline = [
          { title: "Proposal Created", timestamp: new Date(Number(p.startTime) * 1000).toISOString(), status: "Proposed" }
        ];
        if (status === "Active") {
          timeline.push({ title: "Voting Phase Active", timestamp: new Date(Number(p.startTime) * 1000).toISOString(), status: "Active" });
        } else if (status === "Executed") {
          timeline.push({ title: "Transaction Executed", timestamp: new Date(Number(p.endTime) * 1000).toISOString(), status: "Executed" });
        } else if (status === "Canceled") {
          timeline.push({ title: "Proposal Canceled", timestamp: new Date(Number(p.endTime) * 1000).toISOString(), status: "Canceled" });
        } else if (status === "Defeated") {
          timeline.push({ title: "Voting Closed & Defeated", timestamp: new Date(Number(p.endTime) * 1000).toISOString(), status: "Defeated" });
        } else if (status === "Succeeded") {
          timeline.push({ title: "Voting Closed & Passed", timestamp: new Date(Number(p.endTime) * 1000).toISOString(), status: "Passed" });
        }

        loadedProposals.push({
          id: `SIP-OLD-${p.id.toString()}`,
          title: p.title || `Proposal #${p.id.toString()}`,
          description: p.description,
          proposer: p.proposer,
          category: p.category || "General",
          status: status,
          forVotes: forV,
          againstVotes: againstV,
          abstainVotes: abstainV,
          totalVotes: total,
          participationPercentage: parseFloat(participation.toFixed(1)),
          treasuryImpactValue: -Number(formatUnits(p.treasuryImpactValue, 6)),
          treasuryImpact: p.treasuryImpactValue > 0n ? `-${Number(formatUnits(p.treasuryImpactValue, 6)).toLocaleString()} USDC` : "None",
          timeRemaining: "Ended",
          createdAt: new Date(Number(p.startTime) * 1000).toISOString(),
          votingStarts: new Date(Number(p.startTime) * 1000).toISOString(),
          votingEnds: new Date(Number(p.endTime) * 1000).toISOString(),
          executionTarget: p.executionTarget,
          votingDuration: Number(p.votingDuration) / 86400,
          timeline
        });
      }

      // 400ms delay between batches to respect rate limits
      await new Promise(r => setTimeout(r, 400));
    }

    // Sort by ID descending
    loadedProposals.sort((a, b) => {
      const idA = parseInt(a.id.replace('SIP-OLD-', ''));
      const idB = parseInt(b.id.replace('SIP-OLD-', ''));
      return idB - idA;
    });

    const outputDir = path.join(__dirname, '../data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'historical-proposals.json');
    fs.writeFileSync(outputPath, JSON.stringify(loadedProposals, null, 2), 'utf8');
    console.log(`\nSuccessfully dumped ${loadedProposals.length} historical proposals to ${outputPath}`);

  } catch (err) {
    console.error("Fatal error:", err);
  }
}

main();
