import { NextRequest, NextResponse } from "next/server";

// Documented public fallback constant for Arc Testnet RPC
const PUBLIC_BACKUP_RPC = "https://rpc.testnet.arc.network";

/**
 * Server-side RPC proxy for Arc Testnet.
 * Keeps Canteen authenticated RPC URL server-side and forwards JSON-RPC requests.
 */
export async function POST(req: NextRequest) {
  try {
    const upstreamUrl = process.env.ARC_TESTNET_RPC_URL?.trim() || PUBLIC_BACKUP_RPC;
    const bodyText = await req.text();

    let response: Response;
    try {
      response = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: bodyText,
      });

      // If upstream failed with non-2xx and isn't the public backup, fall back to public backup
      if (!response.ok && upstreamUrl !== PUBLIC_BACKUP_RPC) {
        response = await fetch(PUBLIC_BACKUP_RPC, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: bodyText,
        });
      }
    } catch (networkError) {
      // If primary fetch threw (network error / timeout) and wasn't the public backup, try backup
      if (upstreamUrl !== PUBLIC_BACKUP_RPC) {
        response = await fetch(PUBLIC_BACKUP_RPC, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: bodyText,
        });
      } else {
        throw networkError;
      }
    }

    const responseBody = await response.text();
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal RPC proxy error",
        },
        id: null,
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
