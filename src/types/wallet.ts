export type ChainType = "EVM" | "SOLANA" | "SUI"

export const CHAIN_TYPES: ChainType[] = ["EVM", "SOLANA", "SUI"]

export interface WalletAccount {
  chain: ChainType
  address: string
  name: string
  index: number
  privateKey: string
  publicKey?: string
}

export interface ConnectedSite {
  origin: string
  icon: string
  name: string
  approvedAt: number
  chain: ChainType
}

export interface WalletNetwork {
  id: string
  chain: ChainType
  name: string
  rpcUrl: string
  chainId?: number | string
  symbol: string
  decimals: number
  blockExplorerUrl?: string
  metadata?: Record<string, string>
}

export interface WalletToken {
  chain: ChainType
  networkId?: string
  name: string
  symbol: string
  decimal: number
  address: string
  type: "ERC20" | "ERC721" | "ERC1155"
  tokenId?: string
  balance?: string
  image?: string
}

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  gasPrice?: string
  gasLimit?: string
  data?: string
  type: "send" | "receive"
  status: "pending" | "confirmed" | "failed"
  timestamp: string
  tokenAddress?: string
  tokenSymbol?: string
}

export type ChainRecord<T> = Record<ChainType, T>

export interface WalletState {
  isLocked: boolean
  isConnected: boolean
  currentChain: ChainType
  mnemonic: string | null
  password: string | null
  accountsByChain: ChainRecord<WalletAccount[]>
  currentAccountByChain: ChainRecord<WalletAccount | null>
  networksByChain: ChainRecord<WalletNetwork[]>
  currentNetworkByChain: ChainRecord<WalletNetwork | null>
  tokenByChain: ChainRecord<WalletToken[]>
  connectedSites: ConnectedSite[]
}

export interface EthRequestAccountsParams {
  method: "eth_requestAccounts"
  params: []
}

export interface WatchAssetParams {
  method: "eth_watchAsset"
  param: {
    type: "ERC20" | "ERC721" | "ERC1155"
    address: string
    symbol: string
    decimal?: number
    image?: string
    tokenId?: string
  }
}

const INFURA_PROJECT_ID = "c4e28d6f4dfb41cda58ec997065b1068"

export const DEFAULT_NETWORKS: ChainRecord<WalletNetwork[]> = {
  EVM: [
    {
      id: "1",
      chain: "EVM",
      name: "Ethereum Mainnet",
      rpcUrl: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      chainId: 1,
      symbol: "ETH",
      decimals: 18,
      blockExplorerUrl: "https://etherscan.io"
    },
    {
      id: "11155111",
      chain: "EVM",
      name: "Sepolia Testnet",
      rpcUrl: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      chainId: 11155111,
      symbol: "ETH",
      decimals: 18,
      blockExplorerUrl: "https://sepolia.etherscan.io"
    },
    {
      id: "137",
      chain: "EVM",
      name: "Polygon Mainnet",
      rpcUrl: `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      chainId: 137,
      symbol: "POL",
      decimals: 18,
      blockExplorerUrl: "https://polygonscan.com"
    },
    {
      id: "80002",
      chain: "EVM",
      name: "Polygon Amoy Testnet",
      rpcUrl: `https://polygon-amoy.infura.io/v3/${INFURA_PROJECT_ID}`,
      chainId: 80002,
      symbol: "POL",
      decimals: 18,
      blockExplorerUrl: "https://amoy.polygonscan.com"
    }
  ],
  SOLANA: [
    {
      id: "sol-mainnet",
      chain: "SOLANA",
      name: "Solana Mainnet",
      rpcUrl: "https://api.mainnet-beta.solana.com",
      chainId: "mainnet-beta",
      symbol: "SOL",
      decimals: 9,
      blockExplorerUrl: "https://explorer.solana.com"
    },
    {
      id: "sol-devnet",
      chain: "SOLANA",
      name: "Solana Devnet",
      rpcUrl: "https://api.devnet.solana.com",
      chainId: "devnet",
      symbol: "SOL",
      decimals: 9,
      blockExplorerUrl: "https://explorer.solana.com/?cluster=devnet"
    }
  ],
  SUI: [
    {
      id: "sui-mainnet",
      chain: "SUI",
      name: "Sui Mainnet",
      rpcUrl: "https://fullnode.mainnet.sui.io:443",
      chainId: "mainnet",
      symbol: "SUI",
      decimals: 9,
      blockExplorerUrl: "https://suiscan.xyz/mainnet",
      metadata: { network: "mainnet" }
    },
    {
      id: "sui-testnet",
      chain: "SUI",
      name: "Sui Testnet",
      rpcUrl: "https://fullnode.testnet.sui.io:443",
      chainId: "testnet",
      symbol: "SUI",
      decimals: 9,
      blockExplorerUrl: "https://suiscan.xyz/testnet",
      metadata: { network: "testnet" }
    }
  ]
}

export const createEmptyChainRecord = <T>(factory: () => T): ChainRecord<T> => ({
  EVM: factory(),
  SOLANA: factory(),
  SUI: factory()
})

export const cloneDefaultNetworks = (): ChainRecord<WalletNetwork[]> => ({
  EVM: DEFAULT_NETWORKS.EVM.map((network) => ({ ...network })),
  SOLANA: DEFAULT_NETWORKS.SOLANA.map((network) => ({ ...network })),
  SUI: DEFAULT_NETWORKS.SUI.map((network) => ({ ...network }))
})
