import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Validate it's an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only image files are allowed" }, { status: 400 });
    }

    // Max 8MB upload size
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "Image must be under 8MB" }, { status: 400 });
    }

    // ─── 1. Pinata IPFS (if configured) ───────────────────────────────────────
    const pinataJwt = process.env.PINATA_JWT;
    if (pinataJwt && pinataJwt !== "your_pinata_jwt_here") {
      const pinataFormData = new FormData();
      pinataFormData.append("file", file);
      pinataFormData.append("pinataMetadata", JSON.stringify({ name: file.name }));
      pinataFormData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { Authorization: `Bearer ${pinataJwt}` },
        body: pinataFormData,
      });

      if (response.ok) {
        const data = await response.json();
        const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
        const ipfsUrl = `${gateway.endsWith("/") ? gateway : gateway + "/"}${data.IpfsHash}`;
        return NextResponse.json({ success: true, url: ipfsUrl, ipfsHash: data.IpfsHash });
      } else {
        console.error("Pinata upload failed:", await response.text());
        // Fall through to server filesystem
      }
    }

    // ─── 2. Server Filesystem — /public/uploads/ ──────────────────────────────
    // This gives every user a real, shareable URL like /uploads/abc123.jpg
    // Works on any persistent server (VPS, Railway, Render, etc.)
    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Sanitize extension
      const ext = (file.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const allowedExts = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"];
      const safeExt = allowedExts.includes(ext) ? ext : "jpg";

      // Random filename to avoid collisions and hotlink guessing
      const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${safeExt}`;

      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, uniqueName);
      fs.writeFileSync(filePath, buffer);

      // Return a public URL — works for all visitors
      const publicUrl = `/uploads/${uniqueName}`;
      return NextResponse.json({ success: true, url: publicUrl, isLocal: true });
    } catch (fsErr: any) {
      // Filesystem write failed (e.g., read-only Vercel FS) — log and fall through
      console.warn("Server filesystem upload failed, using base64 fallback:", fsErr?.message);
    }

    // ─── 3. Last Resort: Base64 (single-user only — configure Pinata for production) ─
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.warn(
      "⚠️  Image stored as base64 — only visible to the uploader. " +
      "Set PINATA_JWT in .env.local for persistent, shared image hosting."
    );

    return NextResponse.json({
      success: true,
      url: dataUrl,
      isFallback: true,
    });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Upload failed" }, { status: 500 });
  }
}
