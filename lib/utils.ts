import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses and formats EVM/Arc-specific transaction errors for the UI
 */
export function parseArcError(err: any): string {
  const errMsg = (err?.reason || err?.message || err?.toString() || "").toLowerCase();
  
  if (
    errMsg.includes("insufficient funds") ||
    errMsg.includes("intrinsic transaction cost") ||
    errMsg.includes("exceeds balance") ||
    errMsg.includes("insufficient balance") ||
    errMsg.includes("out of gas")
  ) {
    return "Insufficient native USDC for gas. Arc is a stablecoin-native network where transaction fees are paid directly in USDC. Please visit the Faucet to claim testnet gas tokens.";
  }
  
  if (
    errMsg.includes("user rejected") ||
    errMsg.includes("action rejected") ||
    errMsg.includes("rejected the request") ||
    errMsg.includes("user denied") ||
    errMsg.includes("user_rejected") ||
    errMsg.includes("cancelled") ||
    err?.code === 4001
  ) {
    return "Transaction signature request was cancelled or rejected in your wallet.";
  }

  if (
    errMsg.includes("wrong network") ||
    errMsg.includes("chain mismatch") ||
    errMsg.includes("unrecognized chain") ||
    errMsg.includes("switch chain") ||
    errMsg.includes("unsupported chain") ||
    err?.code === 4902
  ) {
    return "Wrong network detected. Please switch your connected wallet to Arc.";
  }

  if (errMsg.includes("vote already cast") || errMsg.includes("already voted")) {
    return "You have already cast a vote on this proposal.";
  }

  if (errMsg.includes("voting is closed") || errMsg.includes("proposal not active") || errMsg.includes("proposal closed")) {
    return "Voting has ended or is not active for this proposal.";
  }
  
  if (errMsg.includes("capacity exceeded") || errMsg.includes("rate limit") || errMsg.includes("429") || errMsg.includes("too many requests") || errMsg.includes("unauthorized")) {
    return "Arc network temporarily unavailable. Please wait a moment and retry.";
  }

  // Generic RPC node data errors or network fetch failures
  if (
    errMsg.includes("rpc node data error") ||
    errMsg.includes("rpc error") ||
    errMsg.includes("failed to fetch") ||
    errMsg.includes("network request failed") ||
    errMsg.includes("fetch failed") ||
    errMsg.includes("econnrefused") ||
    errMsg.includes("socket hang up") ||
    errMsg.includes("etimedout") ||
    errMsg.includes("network error") ||
    errMsg.includes("could not coalesce error")
  ) {
    return "Arc network temporarily unavailable. Please check your connection and try again.";
  }

  if (errMsg.includes("call_exception") || errMsg.includes("execution reverted")) {
    if (errMsg.includes("proposer votes below proposal threshold") || errMsg.includes("below threshold")) {
      return "Transaction reverted: Your voting power (sARC balance) is below the minimum proposal threshold.";
    }
    return "Transaction reverted by the smart contract. Please verify requirements and try again.";
  }
  
  return err?.reason || err?.message || "An unexpected transaction error occurred. Please try again.";
}
