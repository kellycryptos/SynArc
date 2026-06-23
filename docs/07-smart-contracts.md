---
icon: code
---

# Smart Contracts

All core SynArc mechanics operate programmatically through secure on-chain EVM smart contracts. This section details deployed addresses, configurations, and verification steps.

***

## Deployed Contract Addresses

SynArc contracts are deployed on the Arc Testnet (`chainId: 5042002`) and are verified on the ArcScan block explorer.

### Quick Reference

| Contract | Address | ArcScan |
| :--- | :--- | :--- |
| **SynArc Governor** | `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e` | [View on ArcScan](https://testnet.arcscan.app/address/0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e) |
| **SynArc Treasury** | `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18` | [View on ArcScan](https://testnet.arcscan.app/address/0xFE0F6bF45D363d34CD5fC1781594a7471736dC18) |
| **SynArcToken (sARC)** | `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e` | [View on ArcScan](https://testnet.arcscan.app/address/0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e) |
| **EURC Token (Circle)** | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | [View on ArcScan](https://testnet.arcscan.app/address/0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a) |
| **ERC-8004 Registry** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | [View on ArcScan](https://testnet.arcscan.app/address/0x8004A818BFB912233c491871b3d84c89A494BD9e) |
| **SynArcAgent** | `0x4625f81f72dB9BfE78eAce6b0Da249658eBE64de` | [View on ArcScan](https://testnet.arcscan.app/address/0x4625f81f72dB9BfE78eAce6b0Da249658eBE64de) |
| **SynArcCrowdfund** | Dynamic — per Creator DAO | — |

---

## Contract Roles & Specifications

### 1. SynArc Governor (`SynArcGovernor.sol`)
* **Address:** `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e`
* **Description:** Implements Core voting parameters, proposal execution triggers, and quorum rules.
* **Constructor Arguments:**
  - Token address: `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e`
  - Timelock address: `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18`
  - Voting delay: `60` blocks

### 2. SynArc Treasury (`SynArcTreasury.sol`)
* **Address:** `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18`
* **Description:** Vault contract managing USDC/EURC stablecoin deposits and governance-approved disbursements.
* **Constructor Arguments:**
  - USDC token: `0x3600000000000000000000000000000000000000` (Native Arc USDC)
  - EURC token: `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`

### 3. SynArcToken (`SynArcToken.sol`)
* **Address:** `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e`
* **Description:** ERC20 voting asset with checkpoint history tracking to authorize DAO voting power weight.

### 4. SynArcAgent (`SynArcAgent.sol`)
* **Address:** `0x4625f81f72dB9BfE78eAce6b0Da249658eBE64de`
* **Description:** Represents an autonomous AI Agent on-chain. Gated to a hot-wallet execution hot-key for automated yields and proposals while ownership is held by the DAO.
* **Constructor Arguments:**
  - Owner address: `0x35630dFE2592AB19d979ec1B173697aEa554b66b`
  - Executor address: `0x35630dFE2592AB19d979ec1B173697aEa554b66b`
  - Model identifier: `"Groq Llama 3.3 70B"`

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

### Verification Commands

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
   npx hardhat verify --network arcTestnet 0x4625f81f72dB9BfE78eAce6b0Da249658eBE64de 0x35630dFE2592AB19d979ec1B173697aEa554b66b 0x35630dFE2592AB19d979ec1B173697aEa554b66b "Groq Llama 3.3 70B"
   ```
