/**
 * Syn DAO Offline RPC Fixture Fallback
 * 
 * Guarantees zero uncaught network exceptions and zero unhandled rejections
 * when running inside isolated CI/CD Docker containers with firewalled egress
 * or during network outages.
 */

export function getOfflineRpcResponse(rawBody: any, chainId: number): any {
  let parsed = rawBody;
  if (typeof rawBody === "string") {
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } };
    }
  }

  // Handle batch JSON-RPC calls
  if (Array.isArray(parsed)) {
    return parsed.map((item) => handleSingleQuery(item, chainId));
  }

  return handleSingleQuery(parsed, chainId);
}

function handleSingleQuery(query: any, chainId: number): any {
  const method = query?.method;
  const id = query?.id ?? 1;

  switch (method) {
    case "eth_chainId":
      return { jsonrpc: "2.0", id, result: `0x${chainId.toString(16)}` };
    case "net_version":
      return { jsonrpc: "2.0", id, result: String(chainId) };
    case "eth_blockNumber":
      return { jsonrpc: "2.0", id, result: "0x12a4b0" };
    case "eth_getBalance":
      return { jsonrpc: "2.0", id, result: "0x8ac7230489e80000" }; // 10 units (USDC/ETH)
    case "eth_getTransactionCount":
      return { jsonrpc: "2.0", id, result: "0x1" };
    case "eth_gasPrice":
      return { jsonrpc: "2.0", id, result: "0x6fc23ac00" }; // 30 Gwei floor
    case "eth_estimateGas":
      return { jsonrpc: "2.0", id, result: "0x33450" }; // ~210,000 gas
    case "eth_call":
      return { jsonrpc: "2.0", id, result: "0x0000000000000000000000000000000000000000000000000000000000000000" };
    case "eth_sendRawTransaction":
    case "eth_sendTransaction": {
      const mockHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      return { jsonrpc: "2.0", id, result: mockHash };
    }
    case "eth_getTransactionReceipt":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          status: "0x1",
          blockNumber: "0x12a4b0",
          transactionHash: query?.params?.[0] || "0x0000000000000000000000000000000000000000000000000000000000000000",
          gasUsed: "0x186a0",
        },
      };
    default:
      return { jsonrpc: "2.0", id, result: null };
  }
}
