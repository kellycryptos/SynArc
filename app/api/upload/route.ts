import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const pinataJwt = process.env.PINATA_JWT;
    
    if (pinataJwt && pinataJwt !== "your_pinata_jwt_here") {
      // Pinata IPFS Upload
      const pinataFormData = new FormData();
      pinataFormData.append("file", file);
      
      const pinataMetadata = JSON.stringify({
        name: file.name,
      });
      pinataFormData.append("pinataMetadata", pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });
      pinataFormData.append("pinataOptions", pinataOptions);

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: pinataFormData,
      });

      if (response.ok) {
        const data = await response.json();
        // default IPFS gateway
        const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || "https://gateway.pinata.cloud/ipfs/";
        const ipfsUrl = `${gateway.endsWith("/") ? gateway : gateway + "/"}${data.IpfsHash}`;
        return NextResponse.json({ success: true, url: ipfsUrl, ipfsHash: data.IpfsHash });
      } else {
        const errorText = await response.text();
        console.error("Pinata upload error response:", errorText);
      }
    }

    // Fallback: Convert to Base64 data URL
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    return NextResponse.json({
      success: true,
      url: dataUrl,
      isFallback: true
    });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Upload failed" }, { status: 500 });
  }
}
