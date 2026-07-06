import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, fallback } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_RPC_URLS, ARC_GAS, CONTRACTS } from '@/lib/arc-config'

const TOKEN_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

const COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours
const claims = new Map<string, number>()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('wallet')?.toLowerCase()

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const lastClaim = claims.get(walletAddress)
    const now = Date.now()

    if (lastClaim && now - lastClaim < COOLDOWN_MS) {
      const nextClaimAt = new Date(lastClaim + COOLDOWN_MS).toISOString()
      const cooldownSecs = Math.ceil((lastClaim + COOLDOWN_MS - now) / 1000)
      const hours = Math.floor(cooldownSecs / 3600)
      const minutes = Math.floor((cooldownSecs % 3600) / 60)
      return NextResponse.json({
        eligible: false,
        nextClaimAt,
        cooldown: `${hours}h ${minutes}m`
      })
    }

    return NextResponse.json({ eligible: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const walletAddress = (body.walletAddress || body.wallet)?.toLowerCase()

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const lastClaim = claims.get(walletAddress)
    const now = Date.now()

    if (lastClaim && now - lastClaim < COOLDOWN_MS) {
      const nextClaimAt = new Date(lastClaim + COOLDOWN_MS).toISOString()
      const cooldownSecs = Math.ceil((lastClaim + COOLDOWN_MS - now) / 1000)
      const hours = Math.floor(cooldownSecs / 3600)
      const minutes = Math.floor((cooldownSecs % 3600) / 60)
      return NextResponse.json(
        {
          error: 'Already claimed today',
          eligible: false,
          nextClaimAt,
          cooldown: `${hours}h ${minutes}m`
        },
        { status: 429 }
      )
    }

    const rawKey = process.env.FAUCET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY

    if (!rawKey || rawKey === '""' || rawKey === "''") {
      return NextResponse.json({ error: 'Faucet not configured' }, { status: 500 })
    }

    const privateKey = rawKey.startsWith('0x')
      ? (rawKey as `0x${string}`)
      : (`0x${rawKey}` as `0x${string}`)

    const account = privateKeyToAccount(privateKey)
    const transport = fallback(
      ARC_RPC_URLS.map(url =>
        http(url, {
          timeout: 10000,
          retryCount: 3,
          retryDelay: 1000,
        })
      ),
      {
        retryCount: 3,
        retryDelay: 1000,
      }
    )

    const walletClient = createWalletClient({
      account,
      chain: ARC_CHAIN,
      transport,
    })

    const publicClient = createPublicClient({
      chain: ARC_CHAIN,
      transport,
    })

    // Dynamically estimate fees and gas limit
    let gasParams: any = {}
    try {
      const fees = await publicClient.estimateFeesPerGas()
      if (fees.maxFeePerGas && fees.maxPriorityFeePerGas) {
        gasParams.maxFeePerGas = (fees.maxFeePerGas * 130n) / 100n
        gasParams.maxPriorityFeePerGas = (fees.maxPriorityFeePerGas * 130n) / 100n
      } else {
        const gasPrice = await publicClient.getGasPrice()
        gasParams.gasPrice = (gasPrice * 130n) / 100n
      }
    } catch {
      const gasPrice = await publicClient.getGasPrice().catch(() => ARC_GAS.gasPrice)
      gasParams.gasPrice = (gasPrice * 130n) / 100n
    }

    let finalGasLimit: bigint = ARC_GAS.faucet
    try {
      const estimatedGas = await publicClient.estimateContractGas({
        address: CONTRACTS.token,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [walletAddress as `0x${string}`, BigInt(1000) * BigInt(1e18)],
        account,
      })
      finalGasLimit = (estimatedGas * 120n) / 100n
    } catch (e) {
      console.warn('Failed to estimate gas for faucet:', e)
    }

    // 1. Send 1000 sARC (18 decimals)
    const txHash = await walletClient.writeContract({
      address: CONTRACTS.token,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [walletAddress as `0x${string}`, BigInt(1000) * BigInt(1e18)],
      gas: finalGasLimit,
      ...gasParams,
    })

    // Wait for sARC confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60_000
    })

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'sARC transaction failed on-chain' }, { status: 500 })
    }

    // 2. Send 2 USDC gas (6 decimals)
    const USDC_ADDRESS = "0x3600000000000000000000000000000000000000"
    let usdcTxHash: string | undefined
    try {
      // Estimate gas price and limits again or reuse gasParams
      usdcTxHash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [walletAddress as `0x${string}`, BigInt(2 * 1e6)],
        gas: finalGasLimit,
        ...gasParams,
      })

      const usdcReceipt = await publicClient.waitForTransactionReceipt({
        hash: usdcTxHash as `0x${string}`,
        timeout: 60_000
      })

      if (usdcReceipt.status !== 'success') {
        throw new Error('USDC transaction reverted on-chain')
      }
    } catch (usdcErr: any) {
      console.error('Faucet USDC gas transfer failed:', usdcErr)
      return NextResponse.json({
        error: `sARC sent successfully, but USDC gas transfer failed: ${usdcErr?.shortMessage || usdcErr?.message || usdcErr}`
      }, { status: 500 })
    }

    // Register claim time on success
    claims.set(walletAddress, Date.now())

    return NextResponse.json({
      success: true,
      message: "1000 sARC and 2 USDC gas claimed successfully!",
      txHash,
      usdcTxHash,
      explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`
    })

  } catch (error: any) {
    console.error('Faucet error:', error)
    return NextResponse.json(
      { error: error?.shortMessage || error?.message || 'Faucet failed' },
      { status: 500 }
    )
  }
}
