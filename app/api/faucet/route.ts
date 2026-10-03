import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, fallback, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_GAS } from '@/lib/arc-config'

// ─── Testnet-only config (faucet is always testnet) ─────────────────────────
const TESTNET_RPC_URLS = [
  process.env.ARC_TESTNET_RPC_URL?.trim() || '',
  'https://rpc.testnet.arc.network',
  'https://rpc.testnet.arc.io',
].filter(Boolean)

const arcTestnetChain = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network', 'https://rpc.testnet.arc.io'] },
    public:  { http: ['https://rpc.testnet.arc.network', 'https://rpc.testnet.arc.io'] },
  },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
})

const TESTNET_TOKEN_ADDRESS = (
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e'
) as `0x${string}`

// Native Arc USDC contract (6-decimal ERC20 balanceOf, but native gas token has 18-decimal wei)
const TESTNET_NATIVE_USDC = '0x3600000000000000000000000000000000000000' as `0x${string}`

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
const ipClaims = new Map<string, number>()

function getClientIp(req: NextRequest): string {
  if ((req as any).ip) return (req as any).ip
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown-ip'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('wallet')?.toLowerCase()
    const ip = getClientIp(req)

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const lastClaim = claims.get(walletAddress)
    const lastIpClaim = ipClaims.get(ip)
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

    if (ip !== 'unknown-ip' && lastIpClaim && now - lastIpClaim < COOLDOWN_MS) {
      const nextClaimAt = new Date(lastIpClaim + COOLDOWN_MS).toISOString()
      const cooldownSecs = Math.ceil((lastIpClaim + COOLDOWN_MS - now) / 1000)
      const hours = Math.floor(cooldownSecs / 3600)
      const minutes = Math.floor((cooldownSecs % 3600) / 60)
      return NextResponse.json({
        eligible: false,
        nextClaimAt,
        cooldown: `${hours}h ${minutes}m (IP cooldown)`
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
    const ip = getClientIp(req)

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const lastClaim = claims.get(walletAddress)
    const lastIpClaim = ipClaims.get(ip)
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

    if (ip !== 'unknown-ip' && lastIpClaim && now - lastIpClaim < COOLDOWN_MS) {
      const nextClaimAt = new Date(lastIpClaim + COOLDOWN_MS).toISOString()
      const cooldownSecs = Math.ceil((lastIpClaim + COOLDOWN_MS - now) / 1000)
      const hours = Math.floor(cooldownSecs / 3600)
      const minutes = Math.floor((cooldownSecs % 3600) / 60)
      return NextResponse.json(
        {
          error: 'IP address already claimed today',
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
    // ── Always use testnet RPCs directly (faucet is testnet-only) ─────────────
    const transport = fallback(
      TESTNET_RPC_URLS.map(url =>
        http(url, {
          timeout: 12000,
          retryCount: 2,
          retryDelay: 800,
        })
      ),
      {
        retryCount: 2,
        retryDelay: 800,
      }
    )

    const walletClient = createWalletClient({
      account,
      chain: arcTestnetChain,
      transport,
    })

    const publicClient = createPublicClient({
      chain: arcTestnetChain,
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
        address: TESTNET_TOKEN_ADDRESS,
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
      address: TESTNET_TOKEN_ADDRESS,
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

    // 2. Send native USDC gas tokens so users can pay EVM gas fees
    // Arc native currency has 18-decimal wei (same as ETH), so 2 USDC = 2n * 10n**18n
    let usdcTxHash: string | undefined
    try {
      usdcTxHash = await walletClient.sendTransaction({
        to: walletAddress as `0x${string}`,
        value: 2n * 10n ** 18n,   // 2 native USDC in wei (18 decimals)
        gas: 21000n,
        ...gasParams,
      })

      await publicClient.waitForTransactionReceipt({
        hash: usdcTxHash as `0x${string}`,
        timeout: 60_000
      })

      // Also transfer ERC20 USDC (6 decimals) for treasury deposits — best effort
      try {
        await walletClient.writeContract({
          address: TESTNET_NATIVE_USDC,
          abi: TOKEN_ABI,
          functionName: 'transfer',
          args: [walletAddress as `0x${string}`, 2_000_000n],  // 2 USDC at 6 decimals
          gas: finalGasLimit,
          ...gasParams,
        })
      } catch (erc20Err) {
        console.warn('Faucet ERC20 USDC transfer non-critical warning:', erc20Err)
      }
    } catch (usdcErr: any) {
      console.warn('Faucet native USDC gas transfer failed (non-fatal, sARC was sent):', usdcErr?.shortMessage || usdcErr?.message)
      // Don't block success — sARC was already sent and confirmed
    }

    // Register claim time on success
    claims.set(walletAddress, Date.now())
    if (ip !== 'unknown-ip') {
      ipClaims.set(ip, Date.now())
    }

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
