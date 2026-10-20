# DefiLlama Adapter for Syn DAO

This folder contains the complete adapter and metadata required to list **Syn DAO** on [DefiLlama](https://defillama.com).

---

## Files in this Directory

- [`index.js`](./index.js): The DeFiLlama adapter script that tracks TVL and Treasury holdings on Arc Mainnet.
- [`PULL_REQUEST.md`](./PULL_REQUEST.md): The formatted metadata template ready for the GitHub Pull Request.

---

## Step-by-Step Submission Guide

### 1. Fork and Clone the DefiLlama Adapters Repository
Visit [https://github.com/DefiLlama/DefiLlama-Adapters](https://github.com/DefiLlama/DefiLlama-Adapters) and click **Fork**.

Clone your fork locally:
```bash
git clone https://github.com/<your-username>/DefiLlama-Adapters.git
cd DefiLlama-Adapters
npm install
```

### 2. Copy the Adapter Code
Create a new project folder `projects/syndao`:
```bash
mkdir projects/syndao
```

Copy `synarc-dao/defillama/index.js` into `DefiLlama-Adapters/projects/syndao/index.js`.

### 3. Test Locally
Run DefiLlama's local test script to verify that balances on Arc are resolved properly:
```bash
node test.js projects/syndao/index.js
```

### 4. Commit and Push
```bash
git checkout -b add-syndao
git add projects/syndao/index.js
git commit -m "feat: add Syn DAO on Arc"
git push origin add-syndao
```

### 5. Open a Pull Request
1. Open a Pull Request from your branch to `DefiLlama/DefiLlama-Adapters:main`.
2. Fill out the PR body using the prepared template from [`PULL_REQUEST.md`](./PULL_REQUEST.md).
3. Once reviewed and merged by the DefiLlama maintainers, Syn DAO will be tracked live on DefiLlama!
