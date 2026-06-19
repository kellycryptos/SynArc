---
icon: code
---

# Smart Contracts

All core SynArc mechanics operate programmatically through secure on-chain EVM smart contracts. This section details deployed addresses and configurations.

***

## Deployed Contract Addresses

SynArc contracts are deployed on the Arc Testnet and can be inspected on the block explorer:

### 1. SynArc Governor

* **Address:** `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e`
* **Description:** Implements core voting parameters, proposal execution triggers, and quorum rules.
* **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e)

### 2. SynArc Treasury

* **Address:** `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18`
* **Description:** Vault contract managing USDC/EURC stablecoin deposits and governance-approved disbursements.
* **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0xFE0F6bF45D363d34CD5fC1781594a7471736dC18)

### 3. SynArcToken (sARC)

* **Address:** `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e`
* **Description:** Core ERC20 voting asset with checkpoint history tracking to authorize DAO voting power weight.
* **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e)

### 4. EURC Token (Circle)

* **Address:** `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`
* **Description:** Circle's Euro-backed stablecoin used for multi-currency reserve diversity.
* **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a)

### 5. ERC-8004 Identity Registry

* **Address:** `0x8004A818BFB912233c491871b3d84c89A494BD9e`
* **Description:** Ratified on-chain registry for AI Agents identity registration and dynamic reputation index tracking.

### 6. SynArcCrowdfund (Dynamic Escrow)

* **Solidity Source:** `contracts/SynArcCrowdfund.sol`
* **Description:** Deployed on-demand for every crowdfunding campaign to lock USDC stablecoin reserves securely until community milestones are approved.

### 7. SynArcAgent (Autonomous AI Agent)

* **Solidity Source:** `contracts/SynArcAgent.sol`
* **Description:** Represents an autonomous AI Agent on-chain. Gated to a hot-wallet execution hot-key for automated yields and proposals while ownership is held by the DAO.


***

## Network Configuration

Ensure your developer suite or wallet RPC parameters are configured correctly:

* **Network Name:** Arc Testnet
* **Chain ID:** `5042002`
* **Currency Symbol:** `USDC`
* **RPC URL:** `https://rpc.testnet.arc.network`
* **Block Explorer:** `https://testnet.arcscan.app`

***

## Smart Contract Verification on ArcScan

Verifying your smart contracts on [ArcScan](https://testnet.arcscan.app) makes the code readable and interactable for the community. Since core governance contracts are deployed once, while Creator DAO/Crowdfund escrows are deployed dynamically, follow the instructions below to verify them.

### Compiler Configuration Settings

Ensure the compiler parameters in your verify command or web interface match the following settings:
- **Compiler Version:** `v0.8.24+commit.e11b9ed9` (or `0.8.24`)
- **Optimization:** Enabled
- **Runs:** `200`
- **viaIR:** `true`
- **EVM Version:** `cancun`

---

### Option 1: Verification via Hardhat CLI (Recommended)

Verify your deployed contract from the terminal using Hardhat. The configuration is already set up in [hardhat.config.ts](file:///c:/Users/HP/OneDrive/Pictures/Documents/SynArc/synarc-dao/hardhat.config.ts).

#### 1. Core Contracts Verification
Run the verify task with the contract address and its constructor arguments:

- **SynArcToken (sARC)**:
  ```bash
  npx hardhat verify --network arcTestnet <TOKEN_ADDRESS>
  ```
- **SynArcTreasury**:
  ```bash
  npx hardhat verify --network arcTestnet <TREASURY_ADDRESS> "0x3600000000000000000000000000000000000000" "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a"
  ```
- **SynArcGovernor**:
  ```bash
  npx hardhat verify --network arcTestnet <GOVERNOR_ADDRESS> <TOKEN_ADDRESS> <TREASURY_ADDRESS> 60
  ```

#### 2. Creator DAO / Crowdfund Contract Verification
Since `SynArcCrowdfund` requires complex array parameters for milestones, write a temporary `arguments.js` file to verify:

Create a file named `arguments.js` in the project root:
```javascript
module.exports = [
  "0xCreatorAddress...",       // Creator wallet Address
  "0xRecipientAddress...",     // Recipient wallet Address
  "0x3600000000000000000000000000000000000000", // USDC token address
  5000000000n,                 // Goal (6 decimals, e.g. 5000 USDC)
  30n,                         // Duration in days
  false,                       // isAgent (true for AI Agents, false for Human Creator DAOs)
  "My Creator DAO",            // Campaign Title
  "Campaign Description",      // Campaign Description
  "Creator DAO",               // Category
  ["Initial Launch Phase"],    // Milestone titles (string array)
  [5000000000n],               // Milestone budgets (uint256 array)
  ["Release of initial backing capital to kickstart the project."] // Milestone descriptions (string array)
];
```

Then run the verify command pointing to the arguments file:
```bash
npx hardhat verify --network arcTestnet --constructor-args arguments.js <DEPLOYED_CROWDFUND_ADDRESS>
```

---

### Option 2: Verification via ArcScan Web UI

If you want to verify manually via the web explorer interface:

1. Copy the address of your deployed contract (which you can find in the console or campaign creation logs).
2. Visit [ArcScan Testnet Explorer](https://testnet.arcscan.app).
3. Search for the contract address.
4. Go to the **Contract** tab and click **Verify and Publish**.
5. Select the following settings:
   - **Compiler Type:** Solidity (Single File) or Solidity (Standard JSON-Input)
   - **Compiler Version:** `0.8.24`
   - **License Type:** MIT License (MIT)
6. Paste the flattened contract code (you can generate this using `npx hardhat flatten contracts/SynArcCrowdfund.sol`).
7. Expand the **Constructor Arguments ABI-encoded** section.
8. If constructor arguments are required, paste the ABI-encoded arguments. You can get these from the deployment transactions or encode them manually using a tool like [abi.hashex.org](https://abi.hashex.org) with the `SynArcCrowdfund` constructor parameters.
9. Click **Verify and Publish**.
