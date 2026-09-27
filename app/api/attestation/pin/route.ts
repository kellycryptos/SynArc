import { NextRequest, NextResponse } from "next/server";
import { pinJSONToIPFS, validateAttestationURI } from "@/lib/attestation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, description, amount, target, details, documentName } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Proposal title is required." }, { status: 400 });
    }

    const manifestPayload = {
      specVersion: "1.0.0",
      protocol: "SynArc DAO / Tameion Financial Control",
      documentType: "Governance Proposal Deliverable Attestation",
      title,
      category: category || "General",
      description: description || "",
      amountUSDC: amount ? Number(amount) : 0,
      recipientTarget: target || "",
      details: details || {},
      timestamp: new Date().toISOString(),
      network: "Arc Testnet (Chain ID 5042002)",
      sourceWitness: "SynArc Pinned Attestation Document",
    };

    const fileName = documentName || `proposal-${Date.now()}.json`;
    const ipfsUri = await pinJSONToIPFS(manifestPayload, fileName);

    const validation = validateAttestationURI(ipfsUri);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: "Generated attestation failed validation." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ipfsUri,
      ipfsHash: ipfsUri.replace("ipfs://", ""),
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsUri.replace("ipfs://", "")}`,
    });
  } catch (err: any) {
    console.error("Attestation pinning error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to pin attestation to IPFS." }, { status: 500 });
  }
}
