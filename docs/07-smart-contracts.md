---
icon: code
---

# Smart Contracts

Syn DAO is built on Arc. Smart contract names and addresses are unchanged.

All core platform mechanics operate programmatically through secure on-chain EVM smart contracts. This section details deployed addresses, configurations, and verification steps.

***

## Deployed Contract Addresses

### Arc Mainnet — Live Production (Chain ID 5042)

| Contract | Address | Explorer / Blockscout | Sourcify Verification (Chain 5042) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SynArc Treasury** (Release Valve) | `0x8205e9782Fe54fD2aaD895b436B695db169F3d7B` | [View on Arc Explorer](https://explorer.arc.io/address/0x8205e9782Fe54fD2aaD895b436B695db169F3d7B) | [Sourcify UI](https://sourcify.dev/#/lookup/5042/0x8205e9782Fe54fD2aaD895b436B695db169F3d7B) · [Repository](https://repo.sourcify.dev/5042/0x8205e9782Fe54fD2aaD895b436B695db169F3d7B) | Exact Match ✅ |
| **SynArc Governor** (Document Engine) | `0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025` | [View on Arc Explorer](https://explorer.arc.io/address/0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025) | [Sourcify UI](https://sourcify.dev/#/lookup/5042/0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025) · [Repository](https://repo.sourcify.dev/5042/0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025) | Exact Match ✅ |
| **SynArcToken (`sARC`)** | `0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4` | [View on Arc Explorer](https://explorer.arc.io/address/0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4) | [Sourcify UI](https://sourcify.dev/#/lookup/5042/0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4) · [Repository](https://repo.sourcify.dev/5042/0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4) | Exact Match ✅ |
| **SynArcCrowdfund (Primary Escrow)** | `0x99955b487aE5519a2b1Ff677f9bed3A6145b750d` | [View on Arc Explorer](https://explorer.arc.io/address/0x99955b487aE5519a2b1Ff677f9bed3A6145b750d) | [Sourcify UI](https://sourcify.dev/#/lookup/5042/0x99955b487aE5519a2b1Ff677f9bed3A6145b750d) · [Repository](https://repo.sourcify.dev/5042/0x99955b487aE5519a2b1Ff677f9bed3A6145b750d) | Exact Match ✅ |
| **Authorized Operator Agent** | `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D` | [View on Arc Explorer](https://explorer.arc.io/address/0x88BdF819466C1802ce6C780a9fbdF3A314cab07D) | - | Autonomous Signer |
| **Authorized Human Reviewer** | `0xE819090D7810D89f2E86e167d0b58425dEd745D8` | [View on Arc Explorer](https://explorer.arc.io/address/0xE819090D7810D89f2E86e167d0b58425dEd745D8) | - | Deployer Multisig |
| **Canonical USDC** | `0x3600000000000000000000000000000000000000` | [View on Arc Explorer](https://explorer.arc.io/address/0x3600000000000000000000000000000000000000) | - | Native Circle USDC |
| **Canonical EURC** | `0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1` | [View on Arc Explorer](https://explorer.arc.io/address/0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1) | - | Native Circle EURC |
| **Canonical cirBTC** | `0x171A4217b86A807A64eB94757Db6849fb4bDbAA0` | [View on Arc Explorer](https://explorer.arc.io/address/0x171A4217b86A807A64eB94757Db6849fb4bDbAA0) | - | Native Circle cirBTC |

#### Arc Mainnet — Verified Creator DAO Escrow Contracts (`SynArcCrowdfund.sol`)

All 10 Creator DAOs are deployed on Arc Mainnet (Chain ID `5042`) and **100% verified** with `exact_match` on Sourcify / Arc Explorer:

| Campaign | Title | Type | Escrow Address | Sourcify Match |
|:---|:---|:---|:---|:---|
| `camp-main-001` | Aura Synth Lab | Human Creator | `0x99955b487aE5519a2b1Ff677f9bed3A6145b750d` | [Exact Match (55943381)](https://sourcify.dev/#/lookup/5042/0x99955b487aE5519a2b1Ff677f9bed3A6145b750d) |
| `camp-main-002` | ArcShield AI Sentinel | AI Agent Fund | `0x2518d845C9d23AE52650f35C4E4E187BFD797f6B` | [Exact Match (55943506)](https://sourcify.dev/#/lookup/5042/0x2518d845C9d23AE52650f35C4E4E187BFD797f6B) |
| `camp-main-003` | PixelVerse RPG | Human Creator | `0xC6BE1BCE9ADcad9d97a302D652839F399a699460` | [Exact Match (55943507)](https://sourcify.dev/#/lookup/5042/0xC6BE1BCE9ADcad9d97a302D652839F399a699460) |
| `camp-main-004` | Krypton Protocol Research | Human Creator | `0xd1e4F8dfBD1e7eC75Fa58561909706af223c5e34` | [Exact Match (55943508)](https://sourcify.dev/#/lookup/5042/0xd1e4F8dfBD1e7eC75Fa58561909706af223c5e34) |
| `camp-main-005` | Veritas On-Chain Journal | Human Creator | `0x8eC5c246E976b512D7c157714e464D1A38CD59B6` | [Exact Match (55943510)](https://sourcify.dev/#/lookup/5042/0x8eC5c246E976b512D7c157714e464D1A38CD59B6) |
| `camp-main-006` | Solstice Generative Art | Human Creator | `0x11Ae69867785C36ADAcc40D383cd5f19d6288432` | [Exact Match (55943520)](https://sourcify.dev/#/lookup/5042/0x11Ae69867785C36ADAcc40D383cd5f19d6288432) |
| `camp-main-007` | Vanguard Liquidity Optimizer | AI Agent Fund | `0x55bA23c48e3c5bE2A36a93A9124C3f7Cacac6B81` | [Exact Match (55943539)](https://sourcify.dev/#/lookup/5042/0x55bA23c48e3c5bE2A36a93A9124C3f7Cacac6B81) |
| `camp-main-008` | Nexus SubDAO Creator Hub | Human Creator | `0x5821ACB8CD8601cCd3861dD66f459Cd9f0027Dd2` | [Exact Match (55943547)](https://sourcify.dev/#/lookup/5042/0x5821ACB8CD8601cCd3861dD66f459Cd9f0027Dd2) |
| `camp-main-009` | Hyperion Motion Graphics | Human Creator | `0xC566D6E70e76886f2aB253f165E6Bd4A69145025` | [Exact Match (55943562)](https://sourcify.dev/#/lookup/5042/0xC566D6E70e76886f2aB253f165E6Bd4A69145025) |
| `camp-main-010` | Zenith Eco-Track AI Agent | AI Agent Fund | `0x3b56457A3f647CDf04Db064BD6f1Da9e883C185c` | [Exact Match (55943796)](https://sourcify.dev/#/lookup/5042/0x3b56457A3f647CDf04Db064BD6f1Da9e883C185c) |

### Arc Testnet

| Contract | Address | ArcScan |
| :--- | :--- | :--- |
| **SynArc Governor** | `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e` | [View on ArcScan](https://testnet.arcscan.app/address/0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e) |
| **SynArc Treasury** (Governance) | `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18` | [View on ArcScan](https://testnet.arcscan.app/address/0xFE0F6bF45D363d34CD5fC1781594a7471736dC18) |
| **SynArc Treasury** (Agent Operating) | `0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28` | [View on ArcScan](https://testnet.arcscan.app/address/0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28) |
| **SynArcToken (sARC)** | `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e` | [View on ArcScan](https://testnet.arcscan.app/address/0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e) |
| **EURC Token (Circle)** | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | [View on ArcScan](https://testnet.arcscan.app/address/0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a) |
| **cirBTC Token** | `0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF` | [View on ArcScan](https://testnet.arcscan.app/address/0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF) |
| **ERC-8004 Registry** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | [View on ArcScan](https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) |
| **SynArcAgent** | `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D` | [View on ArcScan](https://testnet.arcscan.app/address/0x88BdF819466C1802ce6C780a9fbdF3A314cab07D) |
| **SynArcCrowdfund** | `0xd5374DFC4B01F60115A52Df027704062506b3030` | [View on ArcScan](https://testnet.arcscan.app/address/0xd5374DFC4B01F60115A52Df027704062506b3030) |
| **CCTP Token Messenger** | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` | [View on ArcScan](https://testnet.arcscan.app/address/0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA) |
| **CCTP Message Transmitter** | `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275` | [View on ArcScan](https://testnet.arcscan.app/address/0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275) |

---

## Contract Roles & Specifications

### 1. SynArc Treasury / Release Valve (`SynArcTreasury.sol`)
* **Mainnet Address:** `0x8205e9782Fe54fD2aaD895b436B695db169F3d7B`
* **Testnet Address:** `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18`
* **Description:** Manages multi-asset reserves (USDC/EURC) and executes contract-level Three-Way Match milestone releases. Enforces $\le 50$ USDC autonomous agent policy cap, 48-hour payee timelocked cooldown, and idempotency bit-flip protection.
* For architecture details, see the [Three-Way Match Architecture Guide](07c-three-way-match-architecture.md).

### 2. SynArc Governor (`SynArcGovernor.sol`)
* **Mainnet Address:** `0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025`
* **Testnet Address:** `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e`
* **Description:** Document-anchored governance engine implementing community proposals, 4% quorum verification, cryptographic voting signatures, and timelocked execution triggers.

### 3. SynArcToken (`SynArcToken.sol`)
* **Mainnet Address:** `0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4`
* **Testnet Address:** `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e`
* **Description:** ERC20 voting asset with checkpoint history tracking to authorize DAO voting power weight and community delegation.

### 4. SynArcAgent (`SynArcAgent.sol`)
* **Mainnet / Testnet Address:** `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D`
* **Description:** Represents an autonomous AI Agent on-chain. Gated to a hot-wallet execution key for automated yield sweeps and under-cap releases ($\le 50$ USDC), while ownership is held by the DAO. Registered on the ERC-8004 on-chain agent registry (`0x8004A818BFB912233c491871b3d84c89A494BD9e`).

---

## Verifying Contracts on ArcScan

To verify SynArc smart contracts on ArcScan, use the Hardhat verification toolbox.

### Setup Config
Ensure your `hardhat.config.ts` includes the custom chain configuration for ArcScan:

```typescript
etherscan: {
  apiKey: {
    arcTestnet: "placeholder"
  },
  customChains: [
    {
      network: "arcTestnet",
      chainId: 5042002,
      urls: {
        apiURL: "https://testnet.arcscan.app/api",
        browserURL: "https://testnet.arcscan.app"
      }
    }
  ]
}
```

### Verification Commands (Arc Testnet)

1. **Verify Token**:
   ```bash
   npx hardhat verify --network arcTestnet 0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e
   ```

2. **Verify Treasury**:
   ```bash
   npx hardhat verify --network arcTestnet 0xFE0F6bF45D363d34CD5fC1781594a7471736dC18 0x3600000000000000000000000000000000000000 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a
   ```

3. **Verify Governor**:
   ```bash
   npx hardhat verify --network arcTestnet 0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e 0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e 0xFE0F6bF45D363d34CD5fC1781594a7471736dC18 60
   ```

4. **Verify SynArcAgent**:
   ```bash
   npx hardhat verify --network arcTestnet 0x88BdF819466C1802ce6C780a9fbdF3A314cab07D 0x35630dFE2592AB19d979ec1B173697aEa554b66b 0x35630dFE2592AB19d979ec1B173697aEa554b66b "Groq AI Engine"
   ```

---

## Verifying Contracts on Arc Mainnet (Chain ID 5042)

All Arc Mainnet core contracts are verified with **Exact Match (Full Match)** on **Sourcify** (and indexed on Arc Blockscout Explorer `https://explorer.arc.io`):

| Contract | Address | Compiler | Verification Status | Match ID |
| :--- | :--- | :--- | :--- | :--- |
| **SynArcTreasury** | `0x8205e9782Fe54fD2aaD895b436B695db169F3d7B` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55266790 |
| **SynArcGovernor** | `0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55266387 |
| **SynArcToken** | `0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55267136 |
| **SynArcCrowdfund (Aura Synth Lab)** | `0x99955b487aE5519a2b1Ff677f9bed3A6145b750d` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943381 |
| **SynArcCrowdfund (ArcShield AI Sentinel)** | `0x2518d845C9d23AE52650f35C4E4E187BFD797f6B` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943506 |
| **SynArcCrowdfund (PixelVerse RPG)** | `0xC6BE1BCE9ADcad9d97a302D652839F399a699460` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943507 |
| **SynArcCrowdfund (Krypton Protocol Research)** | `0xd1e4F8dfBD1e7eC75Fa58561909706af223c5e34` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943508 |
| **SynArcCrowdfund (Veritas On-Chain Journal)** | `0x8eC5c246E976b512D7c157714e464D1A38CD59B6` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943510 |
| **SynArcCrowdfund (Solstice Generative Art)** | `0x11Ae69867785C36ADAcc40D383cd5f19d6288432` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943520 |
| **SynArcCrowdfund (Vanguard Liquidity Optimizer)** | `0x55bA23c48e3c5bE2A36a93A9124C3f7Cacac6B81` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943539 |
| **SynArcCrowdfund (Nexus SubDAO Creator Hub)** | `0x5821ACB8CD8601cCd3861dD66f459Cd9f0027Dd2` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943547 |
| **SynArcCrowdfund (Hyperion Motion Graphics)** | `0xC566D6E70e76886f2aB253f165E6Bd4A69145025` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943562 |
| **SynArcCrowdfund (Zenith Eco-Track AI Agent)** | `0x3b56457A3f647CDf04Db064BD6f1Da9e883C185c` | `v0.8.24+commit.e11b9ed9` (runs: 1, viaIR: true, cancun) | **Exact Match ✅** | 55943796 |

### Running the Verification Script

To re-verify or check verification status at any time:
```bash
npx tsx scripts/verifySourcifyMainnet.ts
```

