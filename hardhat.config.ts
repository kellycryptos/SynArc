import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const rawDeployerKey = (process.env.DEPLOYER_PRIVATE_KEY || "").trim().replace(/['"]/g, "");
const DEPLOYER_PRIVATE_KEY = rawDeployerKey.length > 0
  ? (rawDeployerKey.startsWith("0x") ? rawDeployerKey : `0x${rawDeployerKey}`)
  : "0x0000000000000000000000000000000000000000000000000000000000000000";
const hasDeployerKey = DEPLOYER_PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" && DEPLOYER_PRIVATE_KEY.length === 66;

// RPC priority (testnet): Canteen primary → Arc official → Alchemy → hardcoded fallback
// Note: Canteen's RPC is bundled into their ARC CLI and targets their hosted testnet node.
const ARC_RPC_URL =
  process.env.ARC_RPC_URL ||
  process.env.NEXT_PUBLIC_CANTEEN_TESTNET_RPC ||
  process.env.NEXT_PUBLIC_ARC_RPC_URL ||
  process.env.NEXT_PUBLIC_ALCHEMY_TESTNET_RPC ||
  "https://rpc.testnet.arc.network";

const ARC_MAINNET_RPC_URL =
  process.env.ARC_MAINNET_RPC_URL ||
  process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL ||
  process.env.NEXT_PUBLIC_ALCHEMY_MAINNET_RPC ||
  "https://rpc.mainnet.arc.io";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
      viaIR: true,
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    // Primary testnet deployment network
    arcTestnet: {
      url: ARC_RPC_URL,
      chainId: 5042002,
      accounts: hasDeployerKey ? [DEPLOYER_PRIVATE_KEY] : [],
    },
    // Alias used by the ArcScan verify command (--network arc-testnet)
    "arc-testnet": {
      url: ARC_RPC_URL,
      chainId: 5042002,
      accounts: hasDeployerKey ? [DEPLOYER_PRIVATE_KEY] : [],
    },
    // Arc Mainnet (Chain ID 5042)
    arcMainnet: {
      url: ARC_MAINNET_RPC_URL,
      chainId: 5042,
      accounts: hasDeployerKey ? [DEPLOYER_PRIVATE_KEY] : [],
      timeout: 180000,
    },
    "arc-mainnet": {
      url: ARC_MAINNET_RPC_URL,
      chainId: 5042,
      accounts: hasDeployerKey ? [DEPLOYER_PRIVATE_KEY] : [],
      timeout: 180000,
    },
  },
  etherscan: {
    apiKey: {
      arcTestnet: "placeholder",
      "arc-testnet": "placeholder",
      arcMainnet: "placeholder",
      "arc-mainnet": "placeholder",
    },
    customChains: [
      {
        network: "arcTestnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app",
        },
      },
      {
        network: "arc-testnet",
        chainId: 5042002,
        urls: {
          apiURL: "https://testnet.arcscan.app/api",
          browserURL: "https://testnet.arcscan.app",
        },
      },
      {
        network: "arcMainnet",
        chainId: 5042,
        urls: {
          apiURL: "https://explorer.arc.io/api",
          browserURL: "https://explorer.arc.io",
        },
      },
      {
        network: "arc-mainnet",
        chainId: 5042,
        urls: {
          apiURL: "https://explorer.arc.io/api",
          browserURL: "https://explorer.arc.io",
        },
      },
    ],
  },
};

export default config;
