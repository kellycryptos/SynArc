import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, fallback } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { ARC_CHAIN, ARC_GAS } from '@/lib/arc-config'

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

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' }, 
        { status: 400 }
      )
    }

    const account = privateKeyToAccount(
      process.env.FAUCET_PRIVATE_KEY as `0x${string}`
    )

    const walletClient = createWalletClient({
      account,
      chain: ARC_CHAIN,
      transport: fallback([
        http(process.env.NEXT_PUBLIC_ARC_RPC_URL || ''),
        http('https://rpc.testnet.arc.network'),
        http('https://arc-testnet.drpc.org'),
      ])
    })

    // Send 1 sARC token
    const tx = await walletClient.writeContract({
      address: process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: 'transfer',
      args: [
        walletAddress as `0x${string}`,
        BigInt(1 * 10 ** 18) // 1 sARC with 18 decimals
      ],
      gas: ARC_GAS.approve,
      gasPrice: ARC_GAS.gasPrice,
    })

    return NextResponse.json({ 
      success: true, 
      txHash: tx,
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
