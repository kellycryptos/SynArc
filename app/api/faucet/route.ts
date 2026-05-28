import { NextResponse } from "next/server";
import { Wallet, Contract } from "ethers";
import { getResilientProvider } from "@/lib/rpc/config";

// ─── Constants ────────────────────────────────────────────────────────────────
const TOKEN_ADDRESS = "0x637cA7788aBC956832F389A7BB895D5249FE757B";
const FAUCET_AMOUNT_TOKENS = 1n; // 1 sARC token
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours in ms

// Minimal ERC-20 transfer ABI
const ERC20_TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
];

// ─── In-memory rate-limit store ───────────────────────────────────────────────
// Key: lowercase wallet address, Value: timestamp of last successful claim
const claimStore = new Map<string, number>();

function formatCooldown(remainingMs: number): string {
  const totalSecs = Math.ceil(remainingMs / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { wallet } = await request.json();

    // --- Validate wallet address ---
    if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: "A valid wallet address is required." },
        { status: 400 }
      );
    }

    const walletKey = wallet.toLowerCase();

    // --- Rate limit check ---
    const lastClaim = claimStore.get(walletKey);
    const now = Date.now();

    if (lastClaim !== undefined) {
      const elapsed = now - lastClaim;
      if (elapsed < COOLDOWN_MS) {
        const remaining = COOLDOWN_MS - elapsed;
        return NextResponse.json(
          {
            error: "Already claimed today",
            cooldown: formatCooldown(remaining),
            nextClaimAt: new Date(lastClaim + COOLDOWN_MS).toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // --- Validate faucet private key ---
    const privateKey = process.env.FAUCET_PRIVATE_KEY;
    if (!privateKey) {
      // Simulate success in local development when key is missing
      console.warn("FAUCET_PRIVATE_KEY not set — simulating faucet send.");
      claimStore.set(walletKey, now);
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "Faucet simulated (FAUCET_PRIVATE_KEY not configured).",
        amount: "1 sARC",
        wallet,
      });
    }

    // --- Connect provider + signer ---
    const provider = await getResilientProvider();
    const signer = new Wallet(privateKey, provider);

    // --- Get token decimals ---
    const tokenContract = new Contract(TOKEN_ADDRESS, ERC20_TRANSFER_ABI, signer);
    const decimals: bigint = await tokenContract.decimals();
    const amount = FAUCET_AMOUNT_TOKENS * (10n ** decimals);

    // --- Check faucet balance ---
    const faucetBalance: bigint = await tokenContract.balanceOf(signer.address);
    if (faucetBalance < amount) {
      return NextResponse.json(
        { error: "Faucet is currently empty. Please try again later." },
        { status: 503 }
      );
    }

    // --- Send token transfer ---
    const tx = await tokenContract.transfer(wallet, amount, {
      gasLimit: 100000n,
      gasPrice: 10000000n,
    });
    await tx.wait();

    // --- Record claim time ---
    claimStore.set(walletKey, now);

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      amount: "1 sARC",
      wallet,
      message: "1 sARC Token sent to your wallet!",
    });
  } catch (error: any) {
    console.error("Faucet error:", error);
    return NextResponse.json(
      { error: error?.message || "Faucet transaction failed. Please try again." },
      { status: 500 }
    );
  }
}

// ─── GET handler — status check ───────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet || !/^0x[0-9a-fA-F]{40}$/.test(wallet)) {
    return NextResponse.json({ eligible: true, cooldown: null });
  }

  const walletKey = wallet.toLowerCase();
  const lastClaim = claimStore.get(walletKey);
  const now = Date.now();

  if (lastClaim !== undefined) {
    const elapsed = now - lastClaim;
    if (elapsed < COOLDOWN_MS) {
      const remaining = COOLDOWN_MS - elapsed;
      return NextResponse.json({
        eligible: false,
        cooldown: formatCooldown(remaining),
        nextClaimAt: new Date(lastClaim + COOLDOWN_MS).toISOString(),
      });
    }
  }

  return NextResponse.json({ eligible: true, cooldown: null });
}
