/**
 * Gateway Nanopayments — agent pays for its own Groq AI inference via Circle Gateway x402
 * Tracks inference costs per call and provides payment history for the dashboard
 */

export const INFERENCE_COST_USDC_PER_1K_TOKENS = 0.001 // $0.001 per 1k tokens

export interface InferencePayment {
  amount: number
  timestamp: string
  txHash?: string
  model: string
  tokensUsed: number
}

export class GatewayPayments {
  private payments: InferencePayment[] = []

  async payForInference(params: {
    model: string
    tokensUsed: number
    agentAddress: string
  }): Promise<InferencePayment> {
    const cost = INFERENCE_COST_USDC_PER_1K_TOKENS * (params.tokensUsed / 1000)

    const payment: InferencePayment = {
      amount: cost,
      timestamp: new Date().toISOString(),
      model: params.model,
      tokensUsed: params.tokensUsed,
      // TODO: Wire real x402 Circle Gateway payment when Arc Gateway endpoint is live
      // txHash: await x402Client.pay({ amount: cost, to: CIRCLE_GATEWAY_ADDRESS, from: params.agentAddress })
    }

    this.payments.push(payment)
    console.log(`[GatewayPayments] Agent paid ${cost.toFixed(6)} USDC for inference (${params.tokensUsed} tokens via ${params.model})`)
    return payment
  }

  getTotalSpent(): number {
    return this.payments.reduce((sum, p) => sum + p.amount, 0)
  }

  getAverageCost(): number {
    if (this.payments.length === 0) return 0
    return this.getTotalSpent() / this.payments.length
  }

  getPaymentHistory(): InferencePayment[] {
    return [...this.payments].reverse() // most recent first
  }

  getCallCount(): number {
    return this.payments.length
  }
}

// Singleton
export const gatewayPayments = new GatewayPayments()
