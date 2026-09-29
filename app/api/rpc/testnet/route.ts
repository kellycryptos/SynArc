import { NextRequest, NextResponse } from "next/server";

// Documented public fallback constant for Arc Testnet RPC
const PUBLIC_BACKUP_RPC = "https://rpc.testnet.arc.network";

// Rate limiting in-memory storage (IP -> timestamps[])
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests / min per IP

function getClientIp(req: NextRequest): string {
  if ((req as any).ip) return (req as any).ip;
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  
  // Filter out timestamps older than the window
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recent.push(now);
  rateLimitMap.set(ip, recent);

  // Periodic cleanup if map gets large
  if (rateLimitMap.size > 5000) {
    for (const [key, times] of rateLimitMap.entries()) {
      if (times.length === 0 || now - times[times.length - 1] > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  return true;
}

function isOriginAllowed(req: NextRequest): boolean {
  // Explicit cross-site fetch rejected immediately
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  // Trusted internal app header sent by our wagmi/viem transport
  const appSource = req.headers.get("x-synarc-source");
  if (appSource === "app-client") {
    return true;
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host") || "";

  // 1. Validate Origin header if present
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) return true;
      if (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1") return true;
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL);
        if (originUrl.host === siteUrl.host) return true;
      }
      if (originUrl.hostname.endsWith(".vercel.app")) return true;
      return false;
    } catch {
      return false;
    }
  }

  // 2. Validate Referer header if present
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host === host) return true;
      if (refererUrl.hostname === "localhost" || refererUrl.hostname === "127.0.0.1") return true;
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL);
        if (refererUrl.host === siteUrl.host) return true;
      }
      if (refererUrl.hostname.endsWith(".vercel.app")) return true;
      return false;
    } catch {
      return false;
    }
  }

  // 3. In non-production environments, allow local test tools/curl without origin
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  // Allow server-to-server calls where host is matched or sec-fetch-site is same-origin
  if (secFetchSite === "same-origin" || secFetchSite === "none") {
    return true;
  }

  return false;
}

/**
 * Server-side RPC proxy for Arc Testnet.
 * Keeps Canteen authenticated RPC URL server-side, validates access control & rate limits,
 * and forwards JSON-RPC requests.
 */
export async function POST(req: NextRequest) {
  // 1. Access Control: Reject unauthorized cross-site callers
  if (!isOriginAllowed(req)) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Access denied: unauthorized origin or referer",
        },
        id: null,
      },
      { status: 403 }
    );
  }

  // 2. Rate Limiting: Prevent quota abuse
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32005,
          message: "Rate limit exceeded. Please wait a moment before sending more requests.",
        },
        id: null,
      },
      {
        status: 429,
        headers: {
          "Retry-After": "10",
        },
      }
    );
  }

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
      "Access-Control-Allow-Headers": "Content-Type, x-synarc-source",
    },
  });
}
