# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in SynArc, please report it responsibly.

Do not open a public GitHub issue.

Instead, email us directly at: hello@syndaopro.xyz

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Supported Versions

| Version | Supported | Chain ID | Environment |
|---------|-----------|----------|-------------|
| **Arc Mainnet** | ✅ Active | `5042` | Production (Live) |
| **Arc Testnet** | ✅ Active | `5042002` | Developer Sandbox |

## Smart Contract Security

All SynArc core platform smart contracts are deployed and operational on **Arc Mainnet** (Chain ID `5042`) and **Arc Testnet** (Chain ID `5042002`).

Contract addresses and source code are publicly verifiable on Arc block explorers:
- **Arc Mainnet Explorer**: [explorer.arc.io](https://explorer.arc.io)
- **Arc Testnet ArcScan**: [testnet.arcscan.app](https://testnet.arcscan.app)
- **Sourcify Contract Verifier**: [repo.sourcify.dev/5042](https://repo.sourcify.dev/5042/) (Exact Match on Chain ID `5042`)

### Arc Mainnet Production Contracts (Chain ID `5042`)

| Contract | Address | Explorer Link | Status |
|:---|:---|:---|:---|
| **SynArc Treasury** (Release Valve) | `0x8205e9782Fe54fD2aaD895b436B695db169F3d7B` | [View on Arc Explorer](https://explorer.arc.io/address/0x8205e9782Fe54fD2aaD895b436B695db169F3d7B) | Verified (Exact Match) |
| **SynArc Governor** (Document Engine) | `0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025` | [View on Arc Explorer](https://explorer.arc.io/address/0x4f76Fc6a76b16F58826739aC8EeCf7067FDE0025) | Verified (Exact Match) |
| **SynArcToken** (`sARC`) | `0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4` | [View on Arc Explorer](https://explorer.arc.io/address/0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4) | Verified (Exact Match) |
| **SynArcCrowdfund (Primary Escrow)** | `0x99955b487aE5519a2b1Ff677f9bed3A6145b750d` | [View on Arc Explorer](https://explorer.arc.io/address/0x99955b487aE5519a2b1Ff677f9bed3A6145b750d) | Verified (Exact Match) |
| **Authorized Operator Agent** | `0x88BdF819466C1802ce6C780a9fbdF3A314cab07D` | [View on Arc Explorer](https://explorer.arc.io/address/0x88BdF819466C1802ce6C780a9fbdF3A314cab07D) | Autonomous Signer |
| **Authorized Human Reviewer** | `0xE819090D7810D89f2E86e167d0b58425dEd745D8` | [View on Arc Explorer](https://explorer.arc.io/address/0xE819090D7810D89f2E86e167d0b58425dEd745D8) | Deployer Multisig |
| **Canonical USDC (Gas Token)** | `0x3600000000000000000000000000000000000000` | [View on Arc Explorer](https://explorer.arc.io/address/0x3600000000000000000000000000000000000000) | Native Circle USDC |
| **Canonical EURC** | `0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1` | [View on Arc Explorer](https://explorer.arc.io/address/0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1) | Native Circle EURC |
| **Canonical cirBTC** | `0x171A4217b86A807A64eB94757Db6849fb4bDbAA0` | [View on Arc Explorer](https://explorer.arc.io/address/0x171A4217b86A807A64eB94757Db6849fb4bDbAA0) | Native Circle cirBTC |

### Arc Testnet Contracts (Chain ID `5042002`)

| Contract | Address | Explorer Link |
|:---|:---|:---|
| **SynArc Governor** | `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e` | [View on ArcScan](https://testnet.arcscan.app/address/0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e) |
| **SynArc Treasury** (Governance) | `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18` | [View on ArcScan](https://testnet.arcscan.app/address/0xFE0F6bF45D363d34CD5fC1781594a7471736dC18) |
| **SynArc Treasury** (Agent Operating) | `0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28` | [View on ArcScan](https://testnet.arcscan.app/address/0xE6bAC65d7f060B805B8dd6f1c4DBfa6571905f28) |
| **SynArcToken** (`sARC`) | `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e` | [View on ArcScan](https://testnet.arcscan.app/address/0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e) |
| **SynArcCrowdfund** | `0xd5374DFC4B01F60115A52Df027704062506b3030` | [View on ArcScan](https://testnet.arcscan.app/address/0xd5374DFC4B01F60115A52Df027704062506b3030) |
| **EURC Token (Circle)** | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | [View on ArcScan](https://testnet.arcscan.app/address/0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a) |
| **cirBTC Token** | `0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF` | [View on ArcScan](https://testnet.arcscan.app/address/0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF) |
| **ERC-8004 Registry** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | [View on ArcScan](https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) |

### On-Chain Security Controls & Invariants

1. **Contract-Level Three-Way Match**: Solidity verifies Purchase Order (proposal / terms), Receiving Report (deliverable / IPFS hash), and Vendor Invoice (payment claim) match before release.
2. **Autonomous Agent Policy Cap**: Payouts $\le 50$ USDC can execute autonomously via authorized agent hot-key; payouts $> 50$ USDC mandate multi-sig human reviewer signoff.
3. **Payee Timelock Cooldown**: 48-hour mandatory delay enforced on first-time or modified payout recipients.
4. **Idempotency Bit-Flip Guard**: Bitwise tracking prevents replay of any disbursement or milestone execution.
5. **Dual-Agent Adversarial Sentinel Mesh**: Independent forensic auditor monitors mempool and treasury transactions for anomalous outflow vectors.
