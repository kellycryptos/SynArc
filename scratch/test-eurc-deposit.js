const { createPublicClient, createWalletClient, http, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const RPC_URL = 'https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_104d24688adcae992878acabfd41b2ed5800817b20d57aa9b17a64d225c0bf8f';
const EURC_ADDRESS = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
const TREASURY_ADDRESS = '0x8Ab21363cB0319548B051f129e477393908be7c1';
const PRIVATE_KEY = '0x33753de7f90140900fe5f8f81ebcd029178132e631bee20950b1908e1259c845';

const ERC20_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
]);

const TREASURY_ABI = parseAbi([
  'function depositEURC(uint256 amount) external'
]);

async function main() {
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log('Deployer Address:', account.address);

  const publicClient = createPublicClient({
    transport: http(RPC_URL)
  });

  const walletClient = createWalletClient({
    account,
    transport: http(RPC_URL)
  });

  try {
    const balanceBefore = await publicClient.readContract({
      address: EURC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log('Deployer EURC Balance:', Number(balanceBefore) / 1_000_000);

    const depositAmount = 100000n; // 0.1 EURC

    // 1. Approve
    console.log('Sending approve transaction...');
    const approveTx = await walletClient.writeContract({
      address: EURC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [TREASURY_ADDRESS, depositAmount],
      gas: 150000n,
      gasPrice: 40000000000n,
      nonce: 70
    });
    console.log('Approve transaction submitted! Hash:', approveTx);
    
    console.log('Waiting for approval confirmation...');
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
    console.log('Approval confirmed!');

    // Wait a brief moment
    await new Promise(r => setTimeout(r, 1000));

    // 2. Deposit
    console.log('Sending deposit transaction...');
    const depositTx = await walletClient.writeContract({
      address: TREASURY_ADDRESS,
      abi: TREASURY_ABI,
      functionName: 'depositEURC',
      args: [depositAmount],
      gas: 300000n,
      gasPrice: 40000000000n
    });
    console.log('Deposit transaction submitted! Hash:', depositTx);

    console.log('Waiting for deposit confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx });
    console.log('Deposit confirmed! Status:', receipt.status);

    const balanceAfter = await publicClient.readContract({
      address: EURC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account.address]
    });
    console.log('Deployer EURC Balance after deposit:', Number(balanceAfter) / 1_000_000);

  } catch (error) {
    console.error('Execution failed:', error.message || error);
  }
}

main();
