// Arc Testnet gas overrides — bypasses PC wallet extension auto-estimation
export const ARC_GAS_CONFIG = {
  gas: 300000n,
  gasPrice: 10000000n,
} as const

export const ARC_GAS_CONFIG_HIGH = {
  gas: 500000n,
  gasPrice: 10000000n,
} as const

export const ARC_GAS_CONFIG_LOW = {
  gas: 100000n,
  gasPrice: 10000000n,
} as const
