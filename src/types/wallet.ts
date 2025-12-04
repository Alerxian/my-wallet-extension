// 钱包账户
export interface WalletAccount {
  address: string
  name: string
  index: number
  privateKey: string
}

// 钱包状态
export interface WalletState {
  /** 是否锁定 */
  isLocked: boolean
  /** 是否已连接 */
  isConnected: boolean
  /** 钱包账户列表 */
  accounts: WalletAccount[]
  /** 当前选中的钱包账户 */
  currentAccount: WalletAccount | null
  /** 钱包助记词 */
  mnemonic: string | null
  /** 钱包密码 (加密存储，用于自动填充) */
  password: string | null
  /** 钱包网络列表 */
  networks: WalletNetwork[]
  /** 当前选中的钱包网络 */
  currentNetwork: WalletNetwork | null
  /** 钱包代币列表 */
  token: WalletToken[]
  connectedSites: ConnectedSite[]
}

export interface ConnectedSite {
  origin: string
  icon: string
  name: string
  approvedAt: number
}

export interface WalletNetwork {
  /** 钱包网络ID */
  id: string
  /** 钱包网络名称 */
  name: string
  /** 钱包网络RPC URL */
  rpcUrl: string
  /** 钱包网络链ID */
  chainId: number
  /** 钱包网络符号 */
  symbol: string
  /** 钱包网络块浏览器URL */
  blockExplorerUrl?: string
}

export interface WalletToken {
  /** 代币名称 */
  name: string
  /** 代币符号 */
  symbol: string
  /** 代币小数位数 */
  decimal: number
  /** 代币合约地址 */
  address: string
  /** 代币类型 */
  type: "ERC20" | "ERC721" | "ERC1155"
  /** 代币ID（仅适用于ERC721和ERC1155代币） */
  tokenId?: string
  /** 代币余额 */
  balance?: string
  /** 代币图标URL */
  image?: string
}

export interface Transaction {
  /** 交易哈希 */
  hash: string
  /** 交易发送方地址 */
  from: string
  /** 交易接收方地址 */
  to: string
  /** 交易金额（单位：wei） */
  value: string
  /** 交易燃气价格（单位：wei） */
  gasPrice: string
  /** 交易燃气限制 */
  gasLimit: string
  /** 交易数据（仅适用于合约调用） */
  data?: string
  /** 交易类型（发送或接收） */
  type: "send" | "receive"
  /** 交易状态（待确认、已确认或失败） */
  status: "pending" | "confirmed" | "failed"
  /** 交易时间戳 */
  timestamp: string
  /** 交易代币合约地址（仅适用于代币交易） */
  tokenAddress?: string
  /** 交易代币符号（仅适用于代币交易） */
  tokenSymbol?: string
}

// EIP 1102
export interface EthRequestAccountsParams {
  method: "eth_requestAccounts"
  params: []
}

// EIP 747
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

export const DEFAULT_NETWORK = [
  {
    id: "1",
    name: "Ethereum Mainnet",
    rpcUrl: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    chainId: 1,
    symbol: "ETH",
    blockExplorerUrl: "https://etherscan.io"
  },
  // sepolia
  {
    id: "11155111",
    name: "Sepolia Testnet",
    rpcUrl: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
    chainId: 11155111,
    symbol: "ETH",
    blockExplorerUrl: "https://sepolia.etherscan.io"
  },
  // polygon mainnet
  {
    id: "137",
    name: "Polygon Mainnet",
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    chainId: 137,
    symbol: "POL",
    blockExplorerUrl: "https://polygonscan.com"
  },
  // polygon amoy
  {
    id: "80002",
    name: "Polygon Amoy Testnet",
    rpcUrl: `https://polygon-amoy.infura.io/v3/${INFURA_PROJECT_ID}`,
    chainId: 80002,
    symbol: "POL",
    blockExplorerUrl: "https://amoy.polygonscan.com"
  }
]
