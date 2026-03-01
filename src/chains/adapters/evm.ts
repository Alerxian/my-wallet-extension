import { formatEther, HDNodeWallet, isAddress, JsonRpcProvider, parseEther, parseUnits, Wallet } from "ethers"

import type { ChainAdapter, NativeTransferOptions } from "../types"

export class EvmAdapter implements ChainAdapter {
  readonly chain = "EVM" as const

  async deriveAccountFromMnemonic(mnemonic: string, index: number) {
    const path = `m/44'/60'/0'/0/${index}`
    const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path)
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey
    }
  }

  async importPrivateKey(privateKey: string) {
    const wallet = new Wallet(privateKey)
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.signingKey.publicKey
    }
  }

  validateAddress(address: string): boolean {
    return isAddress(address)
  }

  async getBalance(network: NativeTransferOptions["network"], address: string) {
    const provider = new JsonRpcProvider(network.rpcUrl)
    const balance = await provider.getBalance(address)
    return formatEther(balance)
  }

  async signMessage(privateKey: string, message: string) {
    const wallet = new Wallet(privateKey)
    return wallet.signMessage(message)
  }

  async transferNative({
    network,
    privateKey,
    to,
    amount,
    gasLimit,
    gasPriceGwei
  }: NativeTransferOptions): Promise<{ hash: string }> {
    const provider = new JsonRpcProvider(network.rpcUrl)
    const signer = new Wallet(privateKey).connect(provider)

    const tx = await signer.sendTransaction({
      to,
      value: parseEther(amount),
      ...(gasLimit ? { gasLimit: BigInt(gasLimit) } : {}),
      ...(gasPriceGwei ? { gasPrice: parseUnits(gasPriceGwei, "gwei") } : {})
    })

    await tx.wait()
    return { hash: tx.hash }
  }
}

