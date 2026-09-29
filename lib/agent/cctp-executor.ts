import { createWalletClient, createPublicClient, http, fallback, parseUnits, parseAbi, decodeEventLog, keccak256, decodeAbiParameters, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_GAS, ARC_RPC_URLS, IS_MAINNET, CIRCLE_IRIS_API_URL, CIRCLE_ETH_CONFIG, ACTIVE_NETWORK } from '@/lib/arc-config'
import { mainnet, sepolia } from 'viem/chains'

// Circle CCTP contract addresses (dynamically resolved for Mainnet or Testnet)
export const CCTP_CONTRACTS = {
  arc: {
    tokenMessenger: (process.env.NEXT_PUBLIC_CCTP_TOKEN_MESSENGER_ARC || (IS_MAINNET ? '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d' : '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA')) as `0x${string}`,
    messageTransmitter: (process.env.NEXT_PUBLIC_CCTP_MESSAGE_TRANSMITTER_ARC || (IS_MAINNET ? '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' : '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275')) as `0x${string}`,
    usdc: (process.env.NEXT_PUBLIC_USDC_CONTRACT_ADDRESS || '0x3600000000000000000000000000000000000000') as `0x${string}`,
  },
  ethereum: {
    messageTransmitter: CIRCLE_ETH_CONFIG.messageTransmitter,
    tokenMessenger: CIRCLE_ETH_CONFIG.tokenMessenger,
    usdc: CIRCLE_ETH_CONFIG.usdc,
    domain: 0,
  },
  // Backward compatibility aliases
  get arcTestnet() {
    return this.arc
  },
  get ethSepolia() {
    return this.ethereum
  }
}

const TOKEN_MESSENGER_ABI = parseAbi([
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold)',
])

const MESSAGE_TRANSMITTER_ABI = parseAbi([
  'event MessageSent(bytes message)',
  'function receiveMessage(bytes message, bytes attestation) returns (bool)',
])

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
])

export class CCTPExecutor {
  private arcWalletClient: any
  private arcPublicClient: any
  private ethWalletClient: any
  private ethPublicClient: any
  private account: any

  // Backward compatibility aliases
  public get sepoliaWalletClient() { return this.ethWalletClient }
  public get sepoliaPublicClient() { return this.ethPublicClient }

  constructor(privateKey: `0x${string}`) {
    this.account = privateKeyToAccount(privateKey)
    const arcTransport = fallback(
      ARC_RPC_URLS.map(url => http(url, { timeout: 10000 }))
    )
    this.arcPublicClient = createPublicClient({
      chain: ARC_CHAIN,
      transport: arcTransport,
    })
    this.arcWalletClient = createWalletClient({
      account: this.account,
      chain: ARC_CHAIN,
      transport: arcTransport,
    })

    // Ethereum network (Mainnet or Sepolia) configuration
    const ethChain = IS_MAINNET ? mainnet : sepolia
    const ethRpcUrls = IS_MAINNET
      ? Array.from(new Set([
          process.env.NEXT_PUBLIC_ETH_MAINNET_RPC,
          'https://eth.llamarpc.com',
          'https://ethereum-rpc.publicnode.com',
          'https://cloudflare-eth.com'
        ].filter(Boolean) as string[]))
      : Array.from(new Set([
          process.env.NEXT_PUBLIC_SEPOLIA_RPC,
          'https://ethereum-sepolia-rpc.publicnode.com',
          'https://sepolia.gateway.tenderly.co'
        ].filter(Boolean) as string[]))

    const ethTransport = fallback(ethRpcUrls.map(url => http(url, { timeout: 10000 })))
    this.ethPublicClient = createPublicClient({
      chain: ethChain,
      transport: ethTransport
    })
    this.ethWalletClient = createWalletClient({
      account: this.account,
      chain: ethChain,
      transport: ethTransport
    })
  }

  /**
   * Execute CCTP bridge — Arc Testnet → Ethereum Sepolia
   * Burns USDC on Arc, polls attestation, and mints USDC on Sepolia
   */
  async bridgeToEthereum(
    amountUSDC: number,
    recipientAddress: `0x${string}`,
    onProgress?: (msg: string) => void
  ): Promise<{
    burnTxHash: string
    mintTxHash: string
    messageHash: string
    attestationUrl: string
    attestationSignature: string
    status: string
    amount: number
    destinationChain: string
  }> {
    const amountRaw = parseUnits(amountUSDC.toString(), 6)
    const agentAddress = process.env.NEXT_PUBLIC_AGENT_ADDRESS as `0x${string}` | undefined
    const mintRecipient = `0x000000000000000000000000${recipientAddress.slice(2)}` as `0x${string}`

    let burnTx: string

    const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`

    if (agentAddress) {
      const treasuryAgentAddress = process.env.NEXT_PUBLIC_TREASURY_AGENT_ADDRESS as `0x${string}` | undefined
      if (treasuryAgentAddress) {
        const msgTextPrep = `[CCTP Step 0/3] Pulling ${amountUSDC} USDC from Agent Operating Treasury ${treasuryAgentAddress} to Smart Account...`
        console.log(`[CCTPExecutor] ${msgTextPrep}`)
        if (onProgress) onProgress(msgTextPrep)

        const withdrawCalldata = encodeFunctionData({
          abi: parseAbi([
            'function withdraw(address recipient, uint256 amount) external'
          ]),
          functionName: 'withdraw',
          args: [agentAddress, amountRaw]
        })

        const pullTx = await this.arcWalletClient.writeContract({
          address: agentAddress,
          abi: parseAbi([
            'function executeYieldStrategy(address targetContract, address token, uint256 amount, bytes calldata data) external'
          ]),
          functionName: 'executeYieldStrategy',
          args: [
            treasuryAgentAddress,
            CCTP_CONTRACTS.arc.usdc,
            amountRaw,
            withdrawCalldata
          ],
        })
        console.log(`[CCTPExecutor] Pull tx submitted: ${pullTx}. Waiting for confirmation...`)
        await this.arcPublicClient.waitForTransactionReceipt({ hash: pullTx, timeout: 120_000 })
        console.log(`[CCTPExecutor] Pull tx confirmed. USDC now in smart account.`)
      }

      const msgText = `[CCTP Step 1/3] Using Smart Account: ${agentAddress}. Encoding depositForBurn and executing...`
      console.log(`[CCTPExecutor] ${msgText}`)
      if (onProgress) onProgress(msgText)

      const calldata = encodeFunctionData({
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [amountRaw, CCTP_CONTRACTS.ethereum.domain, mintRecipient, CCTP_CONTRACTS.arc.usdc, zeroBytes32, 0n, 2000]
      })

      burnTx = await this.arcWalletClient.writeContract({
        address: agentAddress,
        abi: parseAbi([
          'function executeYieldStrategy(address targetContract, address token, uint256 amount, bytes calldata data) external'
        ]),
        functionName: 'executeYieldStrategy',
        args: [
          CCTP_CONTRACTS.arc.tokenMessenger,
          CCTP_CONTRACTS.arc.usdc,
          amountRaw,
          calldata
        ],
      })
    } else {
      const msgText = `[CCTP Step 1/3] Approving TokenMessenger to spend ${amountUSDC} USDC on Arc (EOA)...`
      console.log(`[CCTPExecutor] ${msgText}`)
      if (onProgress) onProgress(msgText)

      const approveTx = await this.arcWalletClient.writeContract({
        address: CCTP_CONTRACTS.arc.usdc,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CCTP_CONTRACTS.arc.tokenMessenger, amountRaw],
      })
      await this.arcPublicClient.waitForTransactionReceipt({ hash: approveTx, timeout: 120_000 })
      
      const msgText2 = `[CCTP Step 1/3] Approval tx confirmed. Depositing for burn on Arc (EOA)...`
      console.log(`[CCTPExecutor] ${msgText2}`)
      if (onProgress) onProgress(msgText2)

      burnTx = await this.arcWalletClient.writeContract({
        address: CCTP_CONTRACTS.arc.tokenMessenger,
        abi: TOKEN_MESSENGER_ABI,
        functionName: 'depositForBurn',
        args: [amountRaw, CCTP_CONTRACTS.ethereum.domain, mintRecipient, CCTP_CONTRACTS.arc.usdc, zeroBytes32, 0n, 2000],
      })
    }
    
    console.log(`[CCTPExecutor] Burn tx submitted: ${burnTx}. Waiting for confirmation...`)
    const burnReceipt = await this.arcPublicClient.waitForTransactionReceipt({ hash: burnTx, timeout: 120_000 })
    console.log(`[CCTPExecutor] Burn tx confirmed! Parsing logs for CCTP message...`)

    // Extract messageBytes from logs
    let messageBytes: `0x${string}` | null = null
    const MESSAGE_SENT_TOPIC = "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036"

    for (const log of burnReceipt.logs) {
      if (log.topics && log.topics[0] && log.topics[0].toLowerCase() === MESSAGE_SENT_TOPIC.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: MESSAGE_TRANSMITTER_ABI,
            data: log.data,
            topics: log.topics
          })
          if (decoded.eventName === 'MessageSent') {
            messageBytes = decoded.args.message
            break
          }
        } catch (decodeErr) {
          console.warn('[CCTPExecutor] decodeEventLog failed, trying manual decode fallback:', decodeErr)
          try {
            const decodedParams = decodeAbiParameters([{ type: 'bytes' }], log.data)
            if (decodedParams && decodedParams[0]) {
              messageBytes = decodedParams[0] as `0x${string}`
              break
            }
          } catch (manualErr) {
            console.error('[CCTPExecutor] Manual decoding fallback failed:', manualErr)
          }
        }
      }
    }

    if (!messageBytes) {
      throw new Error('MessageSent event was not found in burn transaction logs.')
    }

    const messageHash = keccak256(messageBytes)
    console.log(`[CCTPExecutor] CCTP message hash: ${messageHash}`)

    const targetChainName = CIRCLE_ETH_CONFIG.name

    // Step 3 — Poll Circle Attestation API
    const msgText3 = `[CCTP Step 2/3] Burn transaction confirmed: ${burnTx}. Polling Circle Iris API (${IS_MAINNET ? 'Production' : 'Sandbox'}) for attestation...`
    console.log(`[CCTPExecutor] ${msgText3}`)
    if (onProgress) onProgress(msgText3)

    const attestationUrl = `${CIRCLE_IRIS_API_URL}/${messageHash}`
    let attestation: string | null = null

    // Poll up to 30 times (2.5 minutes)
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch(attestationUrl)
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'complete') {
            attestation = data.attestation
            break
          }
        }
      } catch (pollErr) {
        console.error('[CCTPExecutor] Error polling Circle Iris API:', pollErr)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    if (!attestation) {
      throw new Error('Circle attestation polling timed out or failed.')
    }
    
    const msgText4 = `[CCTP Step 3/3] Circle attestation acquired! Minting USDC on ${targetChainName}...`
    console.log(`[CCTPExecutor] ${msgText4}`)
    if (onProgress) onProgress(msgText4)

    // Step 4 — Mint USDC on Ethereum (Mainnet or Sepolia)
    const mintTx = await this.ethWalletClient.writeContract({
      address: CCTP_CONTRACTS.ethereum.messageTransmitter,
      abi: MESSAGE_TRANSMITTER_ABI,
      functionName: 'receiveMessage',
      args: [messageBytes, attestation as `0x${string}`]
    })

    console.log(`[CCTPExecutor] Mint tx submitted: ${mintTx}. Waiting for confirmation...`)
    await this.ethPublicClient.waitForTransactionReceipt({ hash: mintTx, timeout: 120_000 })
    
    const msgText5 = `[CCTP Success] Rebalance complete! Bridged ${amountUSDC} USDC to ${targetChainName}. Burn Tx: ${burnTx}, Mint Tx: ${mintTx}`
    console.log(`[CCTPExecutor] ${msgText5}`)
    if (onProgress) onProgress(msgText5)

    return {
      burnTxHash: burnTx,
      mintTxHash: mintTx,
      messageHash,
      attestationUrl,
      attestationSignature: attestation,
      status: 'success',
      amount: amountUSDC,
      destinationChain: targetChainName,
    }
  }

  /**
   * Get the executor account's USDC balance on Ethereum (Mainnet or Sepolia)
   */
  async getEthereumUSDCBalance(): Promise<number> {
    try {
      const balance = await this.ethPublicClient.readContract({
        address: CCTP_CONTRACTS.ethereum.usdc,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [this.account.address],
      })
      return Number(balance) / 1_000_000
    } catch (err) {
      console.error(`[CCTPExecutor] Failed to check ${CIRCLE_ETH_CONFIG.name} USDC balance:`, err)
      return 0
    }
  }

  // Backward compatibility alias
  async getSepoliaUSDCBalance(): Promise<number> {
    return this.getEthereumUSDCBalance()
  }

  /**
   * Execute CCTP bridge — Ethereum → Arc
   * Burns USDC on Ethereum, polls attestation, and mints USDC on Arc
   */
  async bridgeToArc(
    amountUSDC: number,
    recipientAddress: `0x${string}`,
    onProgress?: (msg: string) => void
  ): Promise<{
    burnTxHash: string
    mintTxHash: string
    messageHash: string
    attestationUrl: string
    attestationSignature: string
    status: string
    amount: number
    destinationChain: string
  }> {
    const amountRaw = parseUnits(amountUSDC.toString(), 6)
    const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
    const mintRecipient = `0x000000000000000000000000${recipientAddress.slice(2)}` as `0x${string}`
    const sourceChainName = CIRCLE_ETH_CONFIG.name
    const destChainName = IS_MAINNET ? 'Arc' : 'Arc Testnet'

    const msgText = `[CCTP Step 1/3] Approving TokenMessenger to spend ${amountUSDC} USDC on ${sourceChainName}...`
    console.log(`[CCTPExecutor] ${msgText}`)
    if (onProgress) onProgress(msgText)

    // 1. Approve TokenMessenger to spend Ethereum USDC
    const approveTx = await this.ethWalletClient.writeContract({
      address: CCTP_CONTRACTS.ethereum.usdc,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CCTP_CONTRACTS.ethereum.tokenMessenger, amountRaw],
    })
    await this.ethPublicClient.waitForTransactionReceipt({ hash: approveTx, timeout: 120_000 })

    const msgText2 = `[CCTP Step 1/3] Approval tx confirmed: ${approveTx}. Depositing for burn on ${sourceChainName}...`
    console.log(`[CCTPExecutor] ${msgText2}`)
    if (onProgress) onProgress(msgText2)

    // 2. Deposit for Burn on Ethereum (destinationDomain = 26 for Arc)
    const burnTx = await this.ethWalletClient.writeContract({
      address: CCTP_CONTRACTS.ethereum.tokenMessenger,
      abi: TOKEN_MESSENGER_ABI,
      functionName: 'depositForBurn',
      args: [
        amountRaw,
        26, // Arc domain ID
        mintRecipient,
        CCTP_CONTRACTS.ethereum.usdc,
        zeroBytes32,
        0n,
        2000 // Standard finality (zero fee transfer)
      ],
    })

    console.log(`[CCTPExecutor] Burn tx submitted: ${burnTx}. Waiting for confirmation...`)
    const burnReceipt = await this.ethPublicClient.waitForTransactionReceipt({ hash: burnTx, timeout: 120_000 })
    console.log(`[CCTPExecutor] Burn tx confirmed! Parsing logs for CCTP message...`)

    // Extract messageBytes from logs
    let messageBytes: `0x${string}` | null = null
    const MESSAGE_SENT_TOPIC = "0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036"

    for (const log of burnReceipt.logs) {
      if (log.topics && log.topics[0] && log.topics[0].toLowerCase() === MESSAGE_SENT_TOPIC.toLowerCase()) {
        try {
          const decoded = decodeEventLog({
            abi: MESSAGE_TRANSMITTER_ABI,
            data: log.data,
            topics: log.topics
          })
          if (decoded.eventName === 'MessageSent') {
            messageBytes = decoded.args.message
            break
          }
        } catch (decodeErr) {
          console.warn('[CCTPExecutor] decodeEventLog failed, trying manual decode fallback:', decodeErr)
          try {
            const decodedParams = decodeAbiParameters([{ type: 'bytes' }], log.data)
            if (decodedParams && decodedParams[0]) {
              messageBytes = decodedParams[0] as `0x${string}`
              break
            }
          } catch (manualErr) {
            console.error('[CCTPExecutor] Manual decoding fallback failed:', manualErr)
          }
        }
      }
    }

    if (!messageBytes) {
      throw new Error('MessageSent event was not found in burn transaction logs.')
    }

    const messageHash = keccak256(messageBytes)
    console.log(`[CCTPExecutor] CCTP message hash: ${messageHash}`)

    // 3. Poll Circle Attestation API
    const msgText3 = `[CCTP Step 2/3] Burn transaction confirmed: ${burnTx}. Polling Circle Iris API (${IS_MAINNET ? 'Production' : 'Sandbox'}) for attestation...`
    console.log(`[CCTPExecutor] ${msgText3}`)
    if (onProgress) onProgress(msgText3)

    const attestationUrl = `${CIRCLE_IRIS_API_URL}/${messageHash}`
    let attestation: string | null = null

    // Poll up to 30 times (2.5 minutes)
    for (let i = 0; i < 30; i++) {
      try {
        const response = await fetch(attestationUrl)
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'complete') {
            attestation = data.attestation
            break
          }
        }
      } catch (pollErr) {
        console.error('[CCTPExecutor] Error polling Circle Iris API:', pollErr)
      }
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    if (!attestation) {
      throw new Error('Circle attestation polling timed out or failed.')
    }
    
    const msgText4 = `[CCTP Step 3/3] Circle attestation acquired! Minting USDC on ${destChainName}...`
    console.log(`[CCTPExecutor] ${msgText4}`)
    if (onProgress) onProgress(msgText4)

    // 4. Mint USDC on Arc
    const mintTx = await this.arcWalletClient.writeContract({
      address: CCTP_CONTRACTS.arc.messageTransmitter,
      abi: MESSAGE_TRANSMITTER_ABI,
      functionName: 'receiveMessage',
      args: [messageBytes, attestation as `0x${string}`],
      gas: 400000n,
      gasPrice: 10000000n,
    })

    console.log(`[CCTPExecutor] Mint tx submitted: ${mintTx}. Waiting for confirmation...`)
    await this.arcPublicClient.waitForTransactionReceipt({ hash: mintTx, timeout: 120_000 })
    
    const msgText5 = `[CCTP Success] Return complete! Bridged ${amountUSDC} USDC to ${destChainName}. Burn Tx: ${burnTx}, Mint Tx: ${mintTx}`
    console.log(`[CCTPExecutor] ${msgText5}`)
    if (onProgress) onProgress(msgText5)

    return {
      burnTxHash: burnTx,
      mintTxHash: mintTx,
      messageHash,
      attestationUrl,
      attestationSignature: attestation,
      status: 'success',
      amount: amountUSDC,
      destinationChain: destChainName,
    }
  }
}
