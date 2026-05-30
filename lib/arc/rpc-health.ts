import { arcPublicClient } from "./config";

export async function checkArcRPCHealth() {
  try {
    const block = await arcPublicClient.getBlockNumber();

    return {
      healthy: true,
      blockNumber: Number(block)
    };
  } catch {
    return {
      healthy: false
    };
  }
}
