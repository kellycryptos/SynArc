import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, fallback, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_GAS } from '@/lib/arc-config'

// ─── Network Definitions ───────────────────────────────────────────────────
const TESTNET_RPC_URLS = [
  process.env.ARC_TESTNET_RPC_URL?.trim() || '',
  'https://rpc.testnet.arc.network',
  'https://rpc.testnet.arc.io',
].filter(Boolean)

const MAINNET_RPC_URLS = [
  'https://rpc.mainnet.arc.io',
  process.env.ARC_MAINNET_RPC_URL?.trim() || '',
  process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL?.trim() || '',
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

const arcMainnetChain = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.arc.io'] },
    public:  { http: ['https://rpc.mainnet.arc.io'] },
  },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } },
})

const TESTNET_TOKEN_ADDRESS = (
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xBd0C6b83DaBF2c04Ab762C262ea0B036d2D1368e'
) as `0x${string}`

const MAINNET_TOKEN_ADDRESS = (
  process.env.NEXT_PUBLIC_MAINNET_TOKEN_ADDRESS || '0x8f4b429794ABa4607d177b100Cc5e481D22d0ad4'
) as `0x${string}`

// Native Arc USDC contract (6-decimal ERC20)
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
// Track claims keyed by `${network}:${address}` and `${network}:${ip}`
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

function resolveNetwork(req: NextRequest, explicitNetwork?: string | null): 'mainnet' | 'testnet' {
  if (explicitNetwork === 'mainnet' || explicitNetwork === 'testnet') {
    return explicitNetwork
  }
  const referer = req.headers.get('referer') || ''
  if (referer.includes('network=testnet')) return 'testnet'
  if (referer.includes('network=mainnet')) return 'mainnet'
  // Default to mainnet as requested for production governance
  return 'mainnet'
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('wallet')?.toLowerCase()
    const network = resolveNetwork(req, searchParams.get('network'))
    const ip = getClientIp(req)

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const claimKey = `${network}:${walletAddress}`
    const ipClaimKey = `${network}:${ip}`

    const lastClaim = claims.get(claimKey)
    const lastIpClaim = ipClaims.get(ipClaimKey)
    const now = Date.now()

    if (lastClaim && now - lastClaim < COOLDOWN_MS) {
      const nextClaimAt = new Date(lastClaim + COOLDOWN_MS).toISOString()
      const cooldownSecs = Math.ceil((lastClaim + COOLDOWN_MS - now) / 1000)
      const hours = Math.floor(cooldownSecs / 3600)
      const minutes = Math.floor((cooldownSecs % 3600) / 60)
      return NextResponse.json({
        eligible: false,
        nextClaimAt,
        cooldown: `${hours}h ${minutes}m`,
        network,
        amount: network === 'mainnet' ? 10 : 1000,
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
        cooldown: `${hours}h ${minutes}m (IP cooldown)`,
        network,
        amount: network === 'mainnet' ? 10 : 1000,
      })
    }

    return NextResponse.json({
      eligible: true,
      network,
      amount: network === 'mainnet' ? 10 : 1000,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const walletAddress = (body.walletAddress || body.wallet)?.toLowerCase()
    const network = resolveNetwork(req, body.network)
    const ip = getClientIp(req)

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    const claimKey = `${network}:${walletAddress}`
    const ipClaimKey = `${network}:${ip}`

    const lastClaim = claims.get(claimKey)
    const lastIpClaim = ipClaims.get(ipClaimKey)
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
          cooldown: `${hours}h ${minutes}m`,
          network,
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
          cooldown: `${hours}h ${minutes}m`,
          network,
        },
        { status: 429 }
      )
    }

    // On Mainnet, use DEPLOYER_PRIVATE_KEY (owner of 15,000,000 sARC)
    // On Testnet, use FAUCET_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY
    const rawKey = network === 'mainnet'
      ? (process.env.DEPLOYER_PRIVATE_KEY || process.env.FAUCET_PRIVATE_KEY || '')
      : (process.env.FAUCET_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY || '')

    const sanitizedKey = rawKey.trim().replace(/^['"]|['"]$/g, '')

    if (!sanitizedKey || sanitizedKey.length < 10) {
      return NextResponse.json({ error: 'Faucet not configured for this network' }, { status: 500 })
    }

    const privateKey = sanitizedKey.startsWith('0x')
      ? (sanitizedKey as `0x${string}`)
      : (`0x${sanitizedKey}` as `0x${string}`)

    const account = privateKeyToAccount(privateKey)
    const isMainnet = network === 'mainnet'
    const targetChain = isMainnet ? arcMainnetChain : arcTestnetChain
    const tokenAddress = isMainnet ? MAINNET_TOKEN_ADDRESS : TESTNET_TOKEN_ADDRESS
    const rpcUrls = isMainnet ? MAINNET_RPC_URLS : TESTNET_RPC_URLS
    const tokenAmount = isMainnet ? 10n * 10n ** 18n : 1000n * 10n ** 18n
    const tokenDisplay = isMainnet ? '10' : '1000'

    const transport = fallback(
      rpcUrls.map(url =>
        http(url, {
          timeout: 15000,
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
      chain: targetChain,
      transport,
    })

    const publicClient = createPublicClient({
      chain: targetChain,
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
        address: tokenAddress,
        abi: TOKEN_ABI,
        functionName: 'transfer',
        args: [walletAddress as `0x${string}`, tokenAmount],
        account,
      })
      finalGasLimit = (estimatedGas * 130n) / 100n
    } catch (e) {
      console.warn('Failed to estimate gas for faucet transfer:', e)
      finalGasLimit = 100000n
    }

    // Transfer sARC tokens
    const txHash = await walletClient.writeContract({
      address: tokenAddress,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [walletAddress as `0x${string}`, tokenAmount],
      gas: finalGasLimit,
      ...gasParams,
    })

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60_000
    })

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'sARC transaction failed on-chain' }, { status: 500 })
    }

    // If testnet, optionally send testnet native USDC gas tokens
    let usdcTxHash: string | undefined
    if (!isMainnet) {
      try {
        usdcTxHash = await walletClient.sendTransaction({
          to: walletAddress as `0x${string}`,
          value: 2n * 10n ** 18n,   // 2 native USDC in wei
          gas: 21000n,
          ...gasParams,
        })

        await publicClient.waitForTransactionReceipt({
          hash: usdcTxHash as `0x${string}`,
          timeout: 60_000
        })

        // Also transfer ERC20 USDC for testnet deposits — best effort
        try {
          await walletClient.writeContract({
            address: TESTNET_NATIVE_USDC,
            abi: TOKEN_ABI,
            functionName: 'transfer',
            args: [walletAddress as `0x${string}`, 2_000_000n],
            gas: finalGasLimit,
            ...gasParams,
          })
        } catch (erc20Err) {
          console.warn('Testnet ERC20 USDC transfer non-critical warning:', erc20Err)
        }
      } catch (usdcErr: any) {
        console.warn('Testnet native USDC gas transfer non-critical warning:', usdcErr?.shortMessage || usdcErr?.message)
      }
    }

    // Register claim time on success
    claims.set(claimKey, Date.now())
    if (ip !== 'unknown-ip') {
      ipClaims.set(ipClaimKey, Date.now())
    }

    const explorerUrl = isMainnet
      ? `https://explorer.arc.io/tx/${txHash}`
      : `https://testnet.arcscan.app/tx/${txHash}`

    return NextResponse.json({
      success: true,
      message: `${tokenDisplay} sARC claimed successfully on ${isMainnet ? 'Arc Mainnet' : 'Arc Testnet'}!`,
      txHash,
      usdcTxHash,
      explorerUrl,
      amount: Number(tokenDisplay),
      network,
    })

  } catch (error: any) {
    console.error('Faucet error:', error)
    return NextResponse.json(
      { error: error?.shortMessage || error?.message || 'Faucet claim failed' },
      { status: 500 }
    )
  }
}
