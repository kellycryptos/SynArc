/**
 * Server-side Pinata IPFS utilities
 * Strictly server-only: never import into client components.
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
