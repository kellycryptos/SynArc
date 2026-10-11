import * as fs from "fs";
import * as path from "path";

try {
  const { setGlobalDispatcher, Agent } = require("undici");
  setGlobalDispatcher(
    new Agent({
      connect: { timeout: 120000 },
      headersTimeout: 120000,
      bodyTimeout: 120000,
    })
  );
} catch {
  // ignore if not using undici
}

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
    {
      name: "SynArcCrowdfund (Aura Synth Lab)",
      address: "0x99955b487aE5519a2b1Ff677f9bed3A6145b750d",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0x362a107dfe9f3dfe21b2802216b6e8ea12772deac2ca575d57697b162b8c3060",
    },
    {
      name: "SynArcCrowdfund (ArcShield AI Sentinel)",
      address: "0x2518d845C9d23AE52650f35C4E4E187BFD797f6B",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0x37f04240350729a767c630cc76e7b4d10af5f3a7008251dbccbe9928a459c38f",
    },
    {
      name: "SynArcCrowdfund (PixelVerse RPG)",
      address: "0xC6BE1BCE9ADcad9d97a302D652839F399a699460",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0x5caa491e036e0ec0ddaf62e360a3ddc4990ef36c6cf67ec27d5c8688259cc826",
    },
    {
      name: "SynArcCrowdfund (Krypton Protocol Research)",
      address: "0xd1e4F8dfBD1e7eC75Fa58561909706af223c5e34",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0x34c2d2de4f6a99e69ee1cd33ab9ac4c070c31e8e455238433d5bd65483e7021b",
    },
    {
      name: "SynArcCrowdfund (Veritas On-Chain Journal)",
      address: "0x8eC5c246E976b512D7c157714e464D1A38CD59B6",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0x79807a06cce39da58adf6e16861788b32e1d695100c0e3f6ee960cd3ae1b04c5",
    },
    {
      name: "SynArcCrowdfund (Solstice Generative Art)",
      address: "0x11Ae69867785C36ADAcc40D383cd5f19d6288432",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0xba6fa557ba59f21b07b4586f98ace7fc4a41bf91deb558a953a4377dee3dc3b1",
    },
    {
      name: "SynArcCrowdfund (Vanguard Liquidity Optimizer)",
      address: "0x55bA23c48e3c5bE2A36a93A9124C3f7Cacac6B81",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0x64e28af2a53a13bd1c8343e3e8dce2b4cb37bd72045c7043ef08a1eadd4c86d6",
    },
    {
      name: "SynArcCrowdfund (Nexus SubDAO Creator Hub)",
      address: "0x5821ACB8CD8601cCd3861dD66f459Cd9f0027Dd2",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0x6fdc8855c0a51c57608cde081818729606e58d4b464f4fdf0d3cc923ef9f9623",
    },
    {
      name: "SynArcCrowdfund (Hyperion Motion Graphics)",
      address: "0xC566D6E70e76886f2aB253f165E6Bd4A69145025",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0x99d0507278b1f1a93de8afc9efc8070e38e3c1f08fc0d76cdc9f4d17abee0670",
    },
    {
      name: "SynArcCrowdfund (Zenith Eco-Track AI Agent)",
      address: "0x3b56457A3f647CDf04Db064BD6f1Da9e883C185c",
      contractIdentifier: "contracts/SynArcCrowdfund.sol:SynArcCrowdfund",
      creationTxHash: "0x074fc14ac22522628824d12e03f5f3a85fa76e352796239bc55ce916389af747",
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
