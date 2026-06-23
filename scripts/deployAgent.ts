import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying SynArcAgent with the account:", deployer.address);

  const SynArcAgent = await ethers.getContractFactory("SynArcAgent");
  
  console.log("Submitting deployment transaction...");
  // Use explicit gas overrides to avoid transaction sticking
  const agent = await SynArcAgent.deploy(deployer.address, deployer.address, "Groq Llama 3.3 70B", {
    gasPrice: ethers.parseUnits("30", "gwei"),
    gasLimit: 3000000
  });
  
  const tx = agent.deploymentTransaction();
  console.log("Transaction submitted! Hash:", tx?.hash);
  
  console.log("Waiting for confirmation...");
  await agent.waitForDeployment();
  const agentAddress = await agent.getAddress();
  
  console.log("SynArcAgent deployed successfully to:", agentAddress);

  // Update deployments file
  const deploymentsPath = path.join(__dirname, "../deployments/arcTestnet.json");
  if (fs.existsSync(deploymentsPath)) {
    const data = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
    data.agent = agentAddress;
    fs.writeFileSync(deploymentsPath, JSON.stringify(data, null, 2));
    console.log("Updated deployments/arcTestnet.json with agent address:", agentAddress);
  } else {
    const data = {
      network: "arcTestnet",
      chainId: 5042002,
      agent: agentAddress,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(deploymentsPath, JSON.stringify(data, null, 2));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
