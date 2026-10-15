import { parseAbi } from 'viem';

/**
 * Standard ABIs for direct on-chain ERC-20 and ERC-4626 vault operations.
 * Bypasses off-chain EIP-712 permit signatures that trigger OKX Web3 Wallet's
 * "risky signature type" detector.
 */
export const ERC20_ALLOWANCE_ABI = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]);

export const ERC4626_VAULT_ABI = parseAbi([
  'function deposit(uint256 assets, address receiver) returns (uint256 shares)',
  'function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)',
  'function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)',
  'function previewDeposit(uint256 assets) view returns (uint256 shares)',
  'function previewWithdraw(uint256 assets) view returns (uint256 shares)',
  'function previewRedeem(uint256 shares) view returns (uint256 assets)',
  'function convertToAssets(uint256 shares) view returns (uint256 assets)',
  'function convertToShares(uint256 assets) view returns (uint256 shares)',
  'function asset() view returns (address)',
  'function totalAssets() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
]);

export const CCTP_TOKEN_MESSENGER_ABI = parseAbi([
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) returns (uint64)',
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32 destinationCaller, uint256 maxFee, uint32 minFinalityThreshold) returns (uint64)',
]);

export const CCTP_MESSAGE_TRANSMITTER_ABI = parseAbi([
  'event MessageSent(bytes message)',
  'function receiveMessage(bytes message, bytes attestation) returns (bool)',
]);

/**
 * Detects if the current wallet provider or connector is OKX Web3 Wallet.
 */
export function isOKXWallet(provider?: any, connector?: any): boolean {
  if (typeof window !== 'undefined') {
    if ((window as any).okxwallet) return true;
    if ((window as any).ethereum?.isOkxWallet || (window as any).ethereum?.isOKExWallet) return true;
  }
  if (provider?.isOkxWallet || provider?.isOKExWallet) return true;
  if (connector?.name?.toLowerCase().includes('okx') || connector?.id?.toLowerCase().includes('okx')) return true;
  return false;
}

/**
 * Resolves an EIP-1193 provider supporting OKX Web3 Wallet, Wagmi, Privy, and standard window.ethereum.
 */
export function getOKXOrStandardProvider(): any {
  if (typeof window === 'undefined') return null;
  // If OKX is available directly on window.okxwallet
  if ((window as any).okxwallet) {
    return (window as any).okxwallet;
  }
  if ((window as any).ethereum?.isOkxWallet || (window as any).ethereum?.isOKExWallet) {
    return (window as any).ethereum;
  }
  return (window as any).ethereum || null;
}

/**
 * Sanitizes EIP-712 typed data payloads before passing to wallet signing methods.
 * OKX's risk engine flags typed data if:
 * 1. domain.chainId is missing or not a positive integer (e.g., string or undefined)
 * 2. domain.verifyingContract is omitted or zero address
 * 3. types.EIP712Domain doesn't match the keys in domain
 */
export function sanitizeEIP712TypedData(
  typedData: any,
  fallbackChainId: number = 5042,
  fallbackVerifyingContract?: string
): any {
  if (!typedData || typeof typedData !== 'object') return typedData;

  const rawDomain = typedData.domain || {};
  const rawTypes = typedData.types || {};

  // Ensure chainId is a safe integer
  let cleanChainId: number = fallbackChainId;
  if (rawDomain.chainId !== undefined && rawDomain.chainId !== null) {
    const parsed = Number(rawDomain.chainId);
    if (!isNaN(parsed) && parsed > 0) {
      cleanChainId = parsed;
    }
  }

  // Ensure verifyingContract is present and non-empty
  const cleanVerifyingContract =
    rawDomain.verifyingContract ||
    fallbackVerifyingContract ||
    typedData.message?.verifyingContract ||
    typedData.message?.token ||
    '0x3600000000000000000000000000000000000000';

  const cleanDomain: Record<string, any> = {
    ...rawDomain,
    chainId: cleanChainId,
    verifyingContract: cleanVerifyingContract,
  };

  // Rebuild EIP712Domain types schema to strictly reflect the populated domain fields
  const domainTypeFields: Array<{ name: string; type: string }> = [];
  if (cleanDomain.name !== undefined) domainTypeFields.push({ name: 'name', type: 'string' });
  if (cleanDomain.version !== undefined) domainTypeFields.push({ name: 'version', type: 'string' });
  if (cleanDomain.chainId !== undefined) domainTypeFields.push({ name: 'chainId', type: 'uint256' });
  if (cleanDomain.verifyingContract !== undefined) domainTypeFields.push({ name: 'verifyingContract', type: 'address' });
  if (cleanDomain.salt !== undefined) domainTypeFields.push({ name: 'salt', type: 'bytes32' });

  return {
    ...typedData,
    domain: cleanDomain,
    types: {
      ...rawTypes,
      EIP712Domain: domainTypeFields,
    },
  };
}

/**
 * Wraps a Viem adapter's signTypedData method so that any outgoing EIP-712
 * payloads are sanitized to comply with OKX's risk detector.
 */
export function sanitizeAdapterSignatures(adapter: any, rawProvider?: any): any {
  if (!adapter || typeof adapter !== 'object') return adapter;
  if (typeof adapter.signTypedData !== 'function') return adapter;

  const originalSignTypedData = adapter.signTypedData.bind(adapter);

  adapter.signTypedData = async (typedData: any, ctx: any) => {
    const chainId = ctx?.chain?.chainId || ctx?.chain?.id || 5042;
    const sanitized = sanitizeEIP712TypedData(
      typedData,
      Number(chainId),
      ctx?.address
    );

    console.log('[EIP712 Sanitizer] Normalized typed data for wallet signature:', {
      primaryType: sanitized.primaryType,
      domain: sanitized.domain,
    });

    try {
      return await originalSignTypedData(sanitized, ctx);
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      // If OKX or other wallet still flags signature type as risky, rethrow with friendly explanation
      if (msg.includes('risky') || msg.includes('signature type is risky') || msg.includes('cancel')) {
        console.warn('[EIP712 Sanitizer] Wallet flagged signature as risky:', err);
      }
      throw err;
    }
  };

  return adapter;
}
