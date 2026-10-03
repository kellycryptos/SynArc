import { NextRequest, NextResponse } from "next/server";

// Documented official Arc Mainnet RPC
const PUBLIC_BACKUP_RPC = "https://rpc.mainnet.arc.io";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_SECONDS = 60; // 1 minute
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_SECONDS * 1000;
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests / min per IP

// In-memory fallback storage (IP -> timestamps[])
const rateLimitMap = new Map<string, number[]>();

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

function checkInMemoryRateLimit(ip: string): boolean {
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

/**
 * Checks rate limit for client IP.
 */
async function checkRateLimit(ip: string): Promise<boolean> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!kvUrl || !kvToken) {
    return checkInMemoryRateLimit(ip);
  }

  try {
    const currentWindow = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
    const key = `synarc:ratelimit:rpc:mainnet:${ip}:${currentWindow}`;

    const res = await fetch(`${kvUrl.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kvToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, RATE_LIMIT_WINDOW_SECONDS * 2],
      ]),
      signal: AbortSignal.timeout(1500),
    });

    if (!res.ok) {
      return checkInMemoryRateLimit(ip);
    }

    const data = await res.json();
    const count = data?.[0]?.result;
    if (typeof count === "number") {
      return count <= MAX_REQUESTS_PER_WINDOW;
    }

    return checkInMemoryRateLimit(ip);
  } catch {
    return checkInMemoryRateLimit(ip);
  }
}

function isAllowedUrl(urlString: string, host: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.host === host) return true;
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return true;
    if (parsed.hostname.endsWith(".vercel.app")) return true;
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      let rawSite = process.env.NEXT_PUBLIC_SITE_URL;
      if (!/^https?:\/\//i.test(rawSite)) rawSite = `https://${rawSite}`;
      const siteUrl = new URL(rawSite);
      if (parsed.host === siteUrl.host) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function isOriginAllowed(req: NextRequest): boolean {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  const host = req.headers.get("host") || "";
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin && !isAllowedUrl(origin, host)) {
    return false;
  }

  if (referer && !isAllowedUrl(referer, host)) {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  if (secFetchSite === "same-origin" || secFetchSite === "same-site" || secFetchSite === "none") {
    return true;
  }

  if (origin || referer) {
    return true;
  }

  const appSource = req.headers.get("x-synarc-source");
  if (appSource === "app-client") {
    return true;
  }

  return false;
}

/**
 * Server-side RPC proxy for Arc Mainnet.
 * Avoids browser CORS and Cloudflare bot blocking by proxying requests same-origin.
 */
export async function POST(req: NextRequest) {
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

  const clientIp = getClientIp(req);
  const isAllowed = await checkRateLimit(clientIp);
  if (!isAllowed) {
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
    const upstreamUrl =
      process.env.ARC_MAINNET_RPC_URL?.trim() ||
      process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL?.trim() ||
      PUBLIC_BACKUP_RPC;
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

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host") || "";

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-synarc-source",
  };

  if (origin && isAllowedUrl(origin, host)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}
