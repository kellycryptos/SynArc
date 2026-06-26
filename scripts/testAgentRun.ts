import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { treasuryAgent } from '../lib/agent/treasury-agent'

async function main() {
  console.log("=== Starting Treasury Agent Test Tick ===")
  console.log("Agent Address:", treasuryAgent.getAgentAddress())
  console.log("Executor EOA:", (treasuryAgent as any).account?.address)
  
  console.log("Checking treasury balances...")
  const balances = await treasuryAgent.checkTreasury()
  console.log("Treasury Balances:", balances)

  console.log("Running agent tick...")
  const action = await treasuryAgent.run()
  console.log("Agent Result Action:", action)
  console.log("Recent Actions in DB:")
  console.log(treasuryAgent.getRecentActions())
  console.log("=== Test Tick Complete ===")
}

main().catch((error) => {
  console.error("Test tick failed:", error)
  process.exit(1)
})
