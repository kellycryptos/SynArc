# Smart Contracts

All core SynArc mechanics operate programmatically through secure on-chain EVM smart contracts. This section details deployed addresses and configurations.

---

## Deployed Contract Addresses

SynArc contracts are deployed on the Arc Testnet and can be inspected on the block explorer:

### 1. SynArc Governor
*   **Address:** `0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e`
*   **Description:** Implements core voting parameters, proposal execution triggers, and quorum rules.
*   **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0x83Fa2adf3f66e4951D7E9F2576a79e9d644aE25e)

### 2. SynArc Treasury
*   **Address:** `0xFE0F6bF45D363d34CD5fC1781594a7471736dC18`
*   **Description:** Vault contract managing USDC/EURC stablecoin deposits and governance-approved disbursements.
*   **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0xFE0F6bF45D363d34CD5fC1781594a7471736dC18)

### 3. SynArcToken (sARC)
*   **Address:** `0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e`
*   **Description:** Core ERC20 voting asset with checkpoint history tracking to authorize DAO voting power weight.
*   **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e)

### 4. EURC Token (Circle)
*   **Address:** `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`
*   **Description:** Circle's Euro-backed stablecoin used for multi-currency reserve diversity.
*   **Explorer:** [View on ArcScan](https://testnet.arcscan.app/address/0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a)

---

## Network Configuration

Ensure your developer suite or wallet RPC parameters are configured correctly:

*   **Network Name:** Arc Testnet
*   **Chain ID:** `5042002`
*   **Currency Symbol:** `USDC`
*   **RPC URL:** `https://rpc.testnet.arc.network`
*   **Block Explorer:** `https://testnet.arcscan.app`
