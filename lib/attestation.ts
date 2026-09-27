/**
 * Attestation and Proof-of-Deliverable Verification Utilities
 * 
 * Implements real cryptographic and document-linked attestation:
 * - Circle Iris Attestation API links for autonomous CCTP actions
 * - Real IPFS CID pinning (via Pinata) for milestone/funding deliverables
 * - Strict URI schema validation matching SynArcGovernor and SynArcAgent smart contracts
 */

export interface AttestationValidationResult {
  valid: boolean;
  reason?: string;
  type?: 'ipfs_v0' | 'ipfs_v1' | 'circle_iris' | 'cctp_hash' | 'https_doc';
}

/**
 * Validates that an attestation URI satisfies on-chain and off-chain criteria
 * Matches SynArcGovernor.isValidAttestationURI:
 * - ipfs://Qm... (53 chars, CIDv0)
 * - ipfs://baf... (>= 59 chars, CIDv1 base32)
 * - https://iris-api-sandbox.circle.com/... or https://iris-api.circle.com/... (Circle Iris API)
 * - https://... (valid HTTPS document, length 12-256)
 * - cctp:0x... (71 chars, Circle CCTP message hash)
 */
export function validateAttestationURI(uri: string): AttestationValidationResult {
  if (!uri || typeof uri !== 'string') {
    return { valid: false, reason: 'Attestation URI is required.' };
  }

  const trimmed = uri.trim();
  const len = trimmed.length;

  if (len < 12) {
    return { valid: false, reason: 'Attestation URI is too short (min 12 characters).' };
  }

  if (len > 256) {
    return { valid: false, reason: 'Attestation URI is too long (max 256 characters).' };
  }

  // IPFS schemas
  if (trimmed.startsWith('ipfs://')) {
    const hash = trimmed.slice(7);
    if (hash.startsWith('Qm')) {
      if (len !== 53) {
        return { valid: false, reason: 'Invalid IPFS CIDv0 length. Expected 53 characters (ipfs://Qm...).' };
      }
      // Base58 check (alphanumeric except 0, O, I, l)
      if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(hash)) {
        return { valid: false, reason: 'Invalid characters in IPFS CIDv0 hash.' };
      }
      return { valid: true, type: 'ipfs_v0' };
    }

    if (hash.startsWith('baf')) {
      if (len < 59) {
        return { valid: false, reason: 'Invalid IPFS CIDv1 length. Expected at least 59 characters.' };
      }
      // Base32 check (RFC 4648 lowercase: a-z, 2-7)
      if (!/^[a-z2-7]+$/.test(hash)) {
        return { valid: false, reason: 'Invalid characters in IPFS CIDv1. Must be lowercase base32 (a-z, 2-7).' };
      }
      return { valid: true, type: 'ipfs_v1' };
    }

    return { valid: false, reason: 'Unrecognized IPFS CID format. Must start with ipfs://Qm or ipfs://baf.' };
  }

  // Circle Iris API link
  if (trimmed.includes('circle.com') && trimmed.includes('/attestations/')) {
    return { valid: true, type: 'circle_iris' };
  }

  // Standard HTTPS document link
  if (trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return { valid: true, type: 'https_doc' };
    } catch {
      return { valid: false, reason: 'Invalid HTTPS URL format.' };
    }
  }

  // Circle CCTP message hash reference
  if (trimmed.startsWith('cctp:0x')) {
    if (len !== 71) {
      return { valid: false, reason: 'Invalid CCTP reference length. Expected cctp:0x followed by 64 hex characters (71 chars).' };
    }
    const hex = trimmed.slice(7);
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
      return { valid: false, reason: 'Invalid CCTP message hash. Must be 64 hex characters.' };
    }
    return { valid: true, type: 'cctp_hash' };
  }

  return { 
    valid: false, 
    reason: 'Attestation must be a valid IPFS URI (ipfs://Qm... or ipfs://baf...), HTTPS document URL (https://...), or Circle Iris reference.' 
  };
}

/**
 * Resolves an on-chain attestation reference into a publicly viewable HTTPS link:
 * - ipfs://... -> https://gateway.pinata.cloud/ipfs/...
 * - cctp:0x... -> https://iris-api-sandbox.circle.com/v1/attestations/0x...
 * - https://... -> returns unmodified
 */
export function resolveAttestationLink(uri: string): string {
  if (!uri) return '';
  const trimmed = uri.trim();

  if (trimmed.startsWith('ipfs://')) {
    const hash = trimmed.slice(7);
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://gateway.pinata.cloud/ipfs/';
    return `${gateway.endsWith('/') ? gateway : gateway + '/'}${hash}`;
  }

  if (trimmed.startsWith('cctp:0x')) {
    const hash = trimmed.slice(5);
    return `https://iris-api-sandbox.circle.com/v1/attestations/${hash}`;
  }

  return trimmed;
}

/**
 * Pins a JSON document to IPFS via Pinata API (Server-side)
 * Returns the canonical `ipfs://${IpfsHash}` string
 */
export async function pinJSONToIPFS(content: any, documentName: string): Promise<string> {
  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    throw new Error('PINATA_JWT is not configured.');
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: JSON.stringify({
      pinataContent: content,
      pinataMetadata: {
        name: documentName,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata IPFS pinning failed: ${errorText}`);
  }

  const data = await response.json();
  if (!data?.IpfsHash) {
    throw new Error('Pinata response did not contain an IpfsHash');
  }

  return `ipfs://${data.IpfsHash}`;
}
