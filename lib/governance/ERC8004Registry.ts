import { Abi } from "viem";

/**
 * ERC-8004 Trustless Agents Identity Registry Address (Arc Testnet)
 */
export const ERC8004_REGISTRY_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as `0x${string}`;

/**
 * ERC-8004 Identity and Reputation Registry Contract ABI
 */
export const ERC8004RegistryABI = [
  {
    type: "function",
    name: "registerAgent",
    inputs: [
      { name: "agentAddress", type: "address" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "capabilities", type: "string" },
      { name: "metadataURI", type: "string" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "isAgent",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getAgent",
    inputs: [{ name: "agentAddress", type: "address" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "capabilities", type: "string" },
      { name: "metadataURI", type: "string" },
      { name: "reputation", type: "uint256" },
      { name: "active", type: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getAgentReputation",
    inputs: [{ name: "agentAddress", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "updateReputation",
    inputs: [
      { name: "agentAddress", type: "address" },
      { name: "delta", type: "int256" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getAgentsCount",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getAgentAddressByIndex",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agentAddress", type: "address", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "metadataURI", type: "string", indexed: false }
    ]
  },
  {
    type: "event",
    name: "ReputationUpdated",
    inputs: [
      { name: "agentAddress", type: "address", indexed: true },
      { name: "newReputation", type: "uint256", indexed: false },
      { name: "delta", type: "int256", indexed: false }
    ]
  }
] as const satisfies Abi;
