import { createPublicClient, createWalletClient, http, fallback, parseUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_RPC_URLS } from '../lib/arc-config'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

const privateKey = (process.env.FAUCET_PRIVATE_KEY || process.env.AGENT_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`
const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`)

const transport = fallback(ARC_RPC_URLS.map(url => http(url)))
const publicClient = createPublicClient({ chain: ARC_CHAIN, transport })
const walletClient = createWalletClient({ account, chain: ARC_CHAIN, transport })

async function main() {
  const address = account.address
  console.log("Account:", address)

  const transactionCount = await publicClient.getTransactionCount({ address })
  console.log("Current confirmed transaction count (nonce):", transactionCount)

  // Fetch gas price from network
  const currentGasPrice = await publicClient.getGasPrice()
  console.log("Current network gas price:", currentGasPrice.toString(), "wei (", Number(currentGasPrice)/1e9, "gwei)")

  // Let's send a zero-value transaction with a high gas price to override any stuck mempool transaction at the current nonce
  const overrideGasPrice = parseUnits("50", 9) // 50 gwei
  console.log("Submitting speed-up transaction to clear nonce:", transactionCount)
  const txHash = await walletClient.sendTransaction({
    to: address,
    value: 0n,
    nonce: transactionCount,
    gas: 21000n,
    gasPrice: overrideGasPrice
  })
  console.log("Submitted speed-up transaction. Hash:", txHash)
  console.log("Waiting for confirmation...")
  await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60000 })
  console.log("Transaction confirmed! Mempool cleared for nonce:", transactionCount)
}

main().catch((error) => {
  console.error("Failed to clear mempool:", error)
})
