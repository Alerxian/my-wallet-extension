import type { ChainType, WalletNetwork } from "../types/wallet"

export interface ChainKeypair {
  address: string
  privateKey: string
  publicKey?: string
}

export interface NativeTransferOptions {
  network: WalletNetwork
  privateKey: string
  to: string
  amount: string
  gasLimit?: string
  gasPriceGwei?: string
}

export interface ChainAdapter {
  readonly chain: ChainType
  deriveAccountFromMnemonic(mnemonic: string, index: number): Promise<ChainKeypair>
  importPrivateKey(privateKey: string): Promise<ChainKeypair>
  validateAddress(address: string): boolean
  getBalance(network: WalletNetwork, address: string): Promise<string>
  signMessage(privateKey: string, message: string): Promise<string>
  transferNative(options: NativeTransferOptions): Promise<{ hash: string }>
}

