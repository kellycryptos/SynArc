import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, fallback } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN } from '@/lib/arc-config'

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
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const walletAddress = body.walletAddress || body.wallet

    console.log('Faucet request for:', walletAddress)

    // Validate wallet address
    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      )
    }

    // Validate private key exists
    if (!process.env.FAUCET_PRIVATE_KEY) {
      console.error('FAUCET_PRIVATE_KEY not set in environment')
      return NextResponse.json(
        { error: 'Faucet not configured' },
        { status: 500 }
      )
    }

    // Validate token address exists
    if (!process.env.NEXT_PUBLIC_TOKEN_ADDRESS) {
      console.error('TOKEN_ADDRESS not set in environment')
      return NextResponse.json(
        { error: 'Token not configured' },
        { status: 500 }
      )
    }

    // Create deployer account from private key
    const privateKey = process.env.FAUCET_PRIVATE_KEY.startsWith('0x')
      ? (process.env.FAUCET_PRIVATE_KEY as `0x${string}`)
      : (`0x${process.env.FAUCET_PRIVATE_KEY}` as `0x${string}`)

    const account = privateKeyToAccount(privateKey)
    console.log('Faucet deployer address:', account.address)

    // Create clients with fallback RPCs
    const transport = fallback([
      http(process.env.NEXT_PUBLIC_ARC_RPC_URL || ''),
      http('https://rpc.testnet.arc.network'),
      http('https://arc-testnet.drpc.org'),
      http('https://5042002.rpc.thirdweb.com'),
    ])

    const walletClient = createWalletClient({
      account,
      chain: ARC_CHAIN,
      transport,
    })

    const publicClient = createPublicClient({
      chain: ARC_CHAIN,
      transport,
    })

    // Check deployer balance first
    const deployerBalance = await publicClient.readContract({
      address: process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    })

    console.log('Deployer sARC balance:', deployerBalance.toString())

    if (deployerBalance === 0n) {
      console.error('Deployer has no sARC tokens to send')
      return NextResponse.json(
        { error: 'Faucet is empty — deployer has no sARC tokens' },
        { status: 500 }
      )
    }

    // Send 1 sARC — 18 decimals
    const amount = BigInt(1 * 10 ** 18)

    console.log('Sending', amount.toString(), 'sARC to', walletAddress)

    const txHash = await walletClient.writeContract({
      address: process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [
        walletAddress as `0x${string}`,
        amount
      ],
      gas: 100000n,
      gasPrice: 10000000n,
    })

    console.log('Faucet tx hash:', txHash)

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 30_000
    })

    console.log('Faucet tx confirmed:', receipt.status)

    if (receipt.status !== 'success') {
      console.error('Faucet transaction reverted on-chain:', receipt)
      return NextResponse.json(
        { error: 'Faucet transaction failed on-chain' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      txHash,
      message: '1 sARC sent successfully'
    })

  } catch (error: any) {
    console.error('Faucet error:', error)
    return NextResponse.json(
      { error: error?.message || 'Faucet failed' }, 
      { status: 500 }
    )
  }
}
