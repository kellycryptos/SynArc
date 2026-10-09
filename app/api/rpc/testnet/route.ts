import { NextRequest, NextResponse } from "next/server";

// Documented public fallback constant for Arc Testnet RPC
const PUBLIC_BACKUP_RPC = "https://rpc.testnet.arc.network";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_SECONDS = 60; // 1 minute
const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_SECONDS * 1000;
const MAX_REQUESTS_PER_WINDOW = 300; // 300 requests / min per IP to prevent false rate limits

// Canonical Arc Testnet RPC endpoints
const PRIMARY_TESTNET_RPC = "https://rpc.testnet.arc.network";
const SECONDARY_TESTNET_RPC = "https://rpc.testnet.arc.io";

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
 * If Upstash Redis or Vercel KV REST API is configured (KV_REST_API_URL or UPSTASH_REDIS_REST_URL),
 * uses an atomic distributed sliding window across all serverless function instances.
 * Otherwise, falls back to the in-memory sliding window map.
 */
async function checkRateLimit(ip: string): Promise<boolean> {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!kvUrl || !kvToken) {
    return checkInMemoryRateLimit(ip);
  }

  try {
    const currentWindow = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
    const key = `synarc:ratelimit:rpc:${ip}:${currentWindow}`;

    // Upstash / Vercel KV REST API pipeline: INCR counter & set TTL
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
      // 1.5s timeout prevents external KV latency from blocking RPC throughput
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
    // Fail gracefully to in-memory check if external store encounters an issue
    return checkInMemoryRateLimit(ip);
  }
}

function isAllowedUrl(urlString: string, host: string): boolean {
  try {
    const parsed = new URL(urlString);
    const domain = parsed.hostname.toLowerCase();
    const cleanHost = host.split(":")[0].toLowerCase().replace(/^www\./, "");
    const cleanDomain = domain.replace(/^www\./, "");

    // 1. Browser extension wallets (Rabby, MetaMask, etc.)
    if (parsed.protocol === "chrome-extension:" || parsed.protocol === "moz-extension:") return true;

    // 2. Direct host match (with or without port, with or without www)
    if (parsed.host === host || cleanDomain === cleanHost) return true;

    // 3. Local development
    if (domain === "localhost" || domain === "127.0.0.1") return true;

    // 4. Vercel deployment preview and production domains
    if (domain.endsWith(".vercel.app")) return true;

    // 4. Official project domains (apex syndaopro.xyz and any subdomains like www)
    if (domain === "syndaopro.xyz" || domain.endsWith(".syndaopro.xyz")) return true;
    if (domain === "synarc.io" || domain.endsWith(".synarc.io")) return true;
    if (domain === "arc.network" || domain.endsWith(".arc.network") || domain === "arc.io" || domain.endsWith(".arc.io")) return true;

    // 5. Configured site URL (ignoring www mismatch)
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      let rawSite = process.env.NEXT_PUBLIC_SITE_URL;
      if (!/^https?:\/\//i.test(rawSite)) rawSite = `https://${rawSite}`;
      const siteUrl = new URL(rawSite);
      const siteDomain = siteUrl.hostname.toLowerCase().replace(/^www\./, "");
      if (cleanDomain === siteDomain || domain === siteUrl.hostname.toLowerCase()) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function isOriginAllowed(req: NextRequest): boolean {
  const host = req.headers.get("host") || "";
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const secFetchSite = req.headers.get("sec-fetch-site");

  // If explicit Origin header present, validate against allowed domains
  if (origin) {
    return isAllowedUrl(origin, host);
  }

  // If explicit Referer header present, validate against allowed domains
  if (referer) {
    return isAllowedUrl(referer, host);
  }

  // Reject untrusted cross-site requests
  if (secFetchSite === "cross-site") {
    return false;
  }

  // Browser same-origin, same-site, non-browser, or SSR calls
  return true;
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

  // 2. Rate Limiting: Prevent quota abuse (distributed across Vercel lambdas when KV is set)
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
      process.env.ARC_TESTNET_RPC_URL?.trim() || 
      PRIMARY_TESTNET_RPC;
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
        signal: AbortSignal.timeout(5000),
      });

      // If upstream failed with non-2xx and isn't the secondary backup, fall back to secondary backup
      if (!response.ok && upstreamUrl !== SECONDARY_TESTNET_RPC) {
        response = await fetch(SECONDARY_TESTNET_RPC, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: bodyText,
          signal: AbortSignal.timeout(8000),
        });
      }
    } catch (networkError) {
      // If primary fetch threw (network error / timeout) and wasn't the secondary backup, try backup
      if (upstreamUrl !== SECONDARY_TESTNET_RPC) {
        response = await fetch(SECONDARY_TESTNET_RPC, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: bodyText,
          signal: AbortSignal.timeout(8000),
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

  // Only reflect Origin if it is an allowed domain; never open wildcard to arbitrary websites
  if (origin && isAllowedUrl(origin, host)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}
