import * as fs from "fs";
import * as path from "path";

/**
 * verifySourcifyMainnet.ts
 *
 * Verifies SynArc Mainnet contracts on Sourcify (Chain ID 5042)
 * using the official Sourcify v2 API.
 * Blockscout automatically indexes verified contracts from Sourcify.
 */
async function main() {
  const chainId = 5042;
  const buildInfoPath = path.join(
    __dirname,
    "../artifacts/build-info/21be18c8af4f4b099213926eab4840cc.json"
  );

  if (!fs.existsSync(buildInfoPath)) {
    throw new Error(`Build info not found at: ${buildInfoPath}`);
  }

  const bi = JSON.parse(fs.readFileSync(buildInfoPath, "utf-8"));

  const stdJsonInput = {
    language: "Solidity",
    sources: bi.input.sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
      evmVersion: "cancun",
    },
  };

  const contracts = [
    {
      name: "SynArcTreasury",
      address: "0x8205e9782Fe54fD2aaD895b436B695db169F3d7B",
      contractIdentifier: "contracts/SynArcTreasury.sol:SynArcTreasury",
      creationTxHash: "0x47984b5ee2b5d423302c7bb3b7cd40d37ca23382db53483fb5173fc756793083",
    },
    {
      name: "SynArcGovernor",
      address: "0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025",
      contractIdentifier: "contracts/SynArcGovernor.sol:SynArcGovernor",
      creationTxHash: "0x5d03b9866eca5294a74a2e1e778abcf1c55a38947dc4e17751de299c1f675635",
    },
    {
      name: "SynArcToken",
      address: "0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4",
      contractIdentifier: "contracts/SynArcToken.sol:SynArcToken",
      creationTxHash: "0x5419d238842e3a07baaffc15691d54646823f4d1b6e4b4dd94a47958885105c9",
    },
  ];

  console.log("================================================================");
  console.log(`Checking / Verifying SynArc Contracts on Sourcify (Chain ${chainId})`);
  console.log("================================================================\n");

  for (const c of contracts) {
    console.log(`Checking status for ${c.name} (${c.address})...`);
    const checkRes = await fetch(
      `https://sourcify.dev/server/v2/contract/${chainId}/${c.address}`,
      { headers: { "User-Agent": "SynArc-Verifier/1.0" } }
    );

    if (checkRes.ok) {
      const data = await checkRes.json();
      console.log(`  ✅ Already Verified! Status: ${data.match}`);
      console.log(`     Match ID: ${data.matchId}`);
      console.log(`     Verified At: ${data.verifiedAt}`);
      console.log(`     Sourcify UI: https://sourcify.dev/#/lookup/${chainId}/${c.address}`);
      console.log(`     Repository:  https://repo.sourcify.dev/${chainId}/${c.address}\n`);
      continue;
    }

    console.log(`  Submitting verification to Sourcify v2 API...`);
    const postRes = await fetch(
      `https://sourcify.dev/server/v2/verify/${chainId}/${c.address}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "SynArc-Verifier/1.0",
        },
        body: JSON.stringify({
          stdJsonInput,
          compilerVersion: "0.8.24+commit.e11b9ed9",
          contractIdentifier: c.contractIdentifier,
          creationTransactionHash: c.creationTxHash,
        }),
      }
    );

    const postData = await postRes.json();
    if (!postData.verificationId) {
      console.error(`  ❌ Failed to submit:`, postData);
      continue;
    }

    console.log(`  Verification job accepted (ID: ${postData.verificationId}). Polling...`);
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const pollRes = await fetch(
        `https://sourcify.dev/server/v2/verify/${postData.verificationId}`,
        { headers: { "User-Agent": "SynArc-Verifier/1.0" } }
      );
      const pollData = await pollRes.json();
      if (pollData.isJobCompleted) {
        if (pollData.contract && pollData.contract.match) {
          console.log(`  ✅ Verified Successfully! Match: ${pollData.contract.match}`);
          console.log(`     Match ID: ${pollData.contract.matchId}`);
          console.log(`     Sourcify UI: https://sourcify.dev/#/lookup/${chainId}/${c.address}`);
          console.log(`     Repository:  https://repo.sourcify.dev/${chainId}/${c.address}\n`);
        } else {
          console.error(`  ❌ Verification finished with error:`, pollData.error);
        }
        break;
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
