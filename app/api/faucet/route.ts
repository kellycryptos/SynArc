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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const walletAddress = body.walletAddress || body.wallet

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    if (!process.env.FAUCET_PRIVATE_KEY) {
      return NextResponse.json({ error: 'Faucet not configured' }, { status: 500 })
    }

    const privateKey = process.env.FAUCET_PRIVATE_KEY.startsWith('0x')
      ? (process.env.FAUCET_PRIVATE_KEY as `0x${string}`)
      : (`0x${process.env.FAUCET_PRIVATE_KEY}` as `0x${string}`)

    const account = privateKeyToAccount(privateKey)

    const transport = fallback(ARC_RPC_URLS.map(url => http(url)))

    const walletClient = createWalletClient({
      account,
      chain: ARC_CHAIN,
      transport,
    })

    const publicClient = createPublicClient({
      chain: ARC_CHAIN,
      transport,
    })

    // Send 1 sARC (18 decimals)
    const txHash = await walletClient.writeContract({
      address: CONTRACTS.token,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [walletAddress as `0x${string}`, BigInt(1e18)],
      gas: ARC_GAS.faucet,
      gasPrice: ARC_GAS.gasPrice,
    })

    // Wait for real confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60_000
    })

    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed on-chain' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      txHash,
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
