const fs = require('fs');
const path = require('path');
const { setGlobalDispatcher, Agent } = require('undici');

setGlobalDispatcher(
  new Agent({
    connect: { timeout: 120000 },
    headersTimeout: 120000,
    bodyTimeout: 120000,
  })
);

const KNOWN_TX_HASHES = {
  "0x99955b487aE5519a2b1Ff677f9bed3A6145b750d": "0x362a107dfe9f3dfe21b2802216b6e8ea12772deac2ca575d57697b162b8c3060",
  "0x2518d845C9d23AE52650f35C4E4E187BFD797f6B": "0x37f04240350729a767c630cc76e7b4d10af5f3a7008251dbccbe9928a459c38f",
  "0xC6BE1BCE9ADcad9d97a302D652839F399a699460": "0x5caa491e036e0ec0ddaf62e360a3ddc4990ef36c6cf67ec27d5c8688259cc826",
  "0xd1e4F8dfBD1e7eC75Fa58561909706af223c5e34": "0x34c2d2de4f6a99e69ee1cd33ab9ac4c070c31e8e455238433d5bd65483e7021b",
  "0x8eC5c246E976b512D7c157714e464D1A38CD59B6": "0x79807a06cce39da58adf6e16861788b32e1d695100c0e3f6ee960cd3ae1b04c5",
  "0x11Ae69867785C36ADAcc40D383cd5f19d6288432": "0xba6fa557ba59f21b07b4586f98ace7fc4a41bf91deb558a953a4377dee3dc3b1",
  "0x55bA23c48e3c5bE2A36a93A9124C3f7Cacac6B81": "0x64e28af2a53a13bd1c8343e3e8dce2b4cb37bd72045c7043ef08a1eadd4c86d6",
  "0x5821ACB8CD8601cCd3861dD66f459Cd9f0027Dd2": "0x6fdc8855c0a51c57608cde081818729606e58d4b464f4fdf0d3cc923ef9f9623",
  "0xC566D6E70e76886f2aB253f165E6Bd4A69145025": "0x99d0507278b1f1a93de8afc9efc8070e38e3c1f08fc0d76cdc9f4d17abee0670",
  "0x3b56457A3f647CDf04Db064BD6f1Da9e883C185c": "0x074fc14ac22522628824d12e03f5f3a85fa76e352796239bc55ce916389af747",
};

async function main() {
  const chainId = 5042;
  const mainnetDaosPath = path.resolve(__dirname, '../deployments/mainnet_creator_daos.json');
  const daoData = JSON.parse(fs.readFileSync(mainnetDaosPath, 'utf8'));

  const buildInfoPath = path.resolve(__dirname, '../artifacts/build-info/21be18c8af4f4b099213926eab4840cc.json');
  const bi = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));

  const stdJsonInput = {
    language: 'Solidity',
    sources: bi.input.sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
      evmVersion: 'cancun',
    },
  };

  for (let i = 0; i < daoData.campaigns.length; i++) {
    const c = daoData.campaigns[i];
    const address = c.escrowAddress;
    const txHash = KNOWN_TX_HASHES[address];

    console.log(`\n----------------------------------------------------------------`);
    console.log(`Checking [${i + 1}/${daoData.campaigns.length}] ${c.title} (${address})`);
    console.log(`----------------------------------------------------------------`);

    // Check Sourcify
    let verified = false;
    try {
      const checkRes = await fetch(`https://sourcify.dev/server/v2/contract/${chainId}/${address}`, {
        headers: { 'User-Agent': 'SynArc-Verifier/1.0' },
      });
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.match) {
          console.log(`✅ Already Verified (${data.match})! Match ID: ${data.matchId}`);
          verified = true;
        }
      }
    } catch (e) {
      console.warn("Check failed, will try verify:", e.message);
    }

    if (verified) continue;

    console.log(`Submitting verification with tx ${txHash}...`);
    try {
      const postRes = await fetch(`https://sourcify.dev/server/v2/verify/${chainId}/${address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SynArc-Verifier/1.0',
        },
        body: JSON.stringify({
          stdJsonInput,
          compilerVersion: '0.8.24+commit.e11b9ed9',
          contractIdentifier: 'contracts/SynArcCrowdfund.sol:SynArcCrowdfund',
          creationTransactionHash: txHash,
        }),
      });

      const postData = await postRes.json();
      if (!postData.verificationId) {
        console.error(`❌ Verification submission failed:`, postData);
        continue;
      }

      console.log(`Job accepted (${postData.verificationId}). Polling...`);
      for (let p = 0; p < 20; p++) {
        await new Promise((r) => setTimeout(r, 3000));
        const pollRes = await fetch(`https://sourcify.dev/server/v2/verify/${postData.verificationId}`, {
          headers: { 'User-Agent': 'SynArc-Verifier/1.0' },
        });
        const pollData = await pollRes.json();
        if (pollData.isJobCompleted) {
          if (pollData.contract && pollData.contract.match) {
            console.log(`🎉 Verified! Match: ${pollData.contract.match} (ID: ${pollData.contract.matchId})`);
          } else {
            console.error(`❌ Failed:`, pollData.error || pollData);
          }
          break;
        }
      }
    } catch (err) {
      console.error(`Error during verification:`, err.message);
    }
  }
}

main().catch(console.error);
