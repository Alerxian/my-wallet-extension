import { SuiClient } from "@mysten/sui.js/client"
import { decodeSuiPrivateKey } from "@mysten/sui.js/cryptography"
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519"
import { TransactionBlock } from "@mysten/sui.js/transactions"
import { isValidSuiAddress } from "@mysten/sui.js/utils"

import {
  formatUnits,
  fromHex,
  parseDecimalToBigInt,
  parseJsonUint8Array,
  utf8ToBytes
} from "../helpers"
import type { ChainAdapter, NativeTransferOptions } from "../types"

const SUI_DECIMALS = 9
const SUI_DERIVATION_PATH = (index: number) => `m/44'/784'/${index}'/0'/0'`

const createClient = (network: NativeTransferOptions["network"]) =>
  new SuiClient({
    url: network.rpcUrl
  })

const parseSuiPrivateKey = (privateKey: string): Ed25519Keypair => {
  const normalized = privateKey.trim()
  if (!normalized) {
    throw new Error("Private key is required")
  }

  if (normalized.startsWith("suiprivkey")) {
    const decoded = decodeSuiPrivateKey(normalized)
    return Ed25519Keypair.fromSecretKey(decoded.secretKey)
  }

  const parsed = parseJsonUint8Array(normalized)
  if (parsed) {
    if (parsed.length === 64) return Ed25519Keypair.fromSecretKey(parsed.slice(0, 32))
    if (parsed.length === 32) return Ed25519Keypair.fromSecretKey(parsed)
  }

  if (/^(0x)?[0-9a-fA-F]+$/.test(normalized)) {
    const bytes = fromHex(normalized)
    if (bytes.length === 64) return Ed25519Keypair.fromSecretKey(bytes.slice(0, 32))
    if (bytes.length === 32) return Ed25519Keypair.fromSecretKey(bytes)
  }

  throw new Error("Unsupported Sui private key format")
}

export class SuiAdapter implements ChainAdapter {
  readonly chain = "SUI" as const

  async deriveAccountFromMnemonic(mnemonic: string, index: number) {
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic, SUI_DERIVATION_PATH(index))

    return {
      address: keypair.getPublicKey().toSuiAddress(),
      privateKey: keypair.getSecretKey(),
      publicKey: keypair.getPublicKey().toBase64()
    }
  }

  async importPrivateKey(privateKey: string) {
    const keypair = parseSuiPrivateKey(privateKey)

    return {
      address: keypair.getPublicKey().toSuiAddress(),
      privateKey: keypair.getSecretKey(),
      publicKey: keypair.getPublicKey().toBase64()
    }
  }

  validateAddress(address: string): boolean {
    return isValidSuiAddress(address)
  }

  async getBalance(network: NativeTransferOptions["network"], address: string) {
    const client = createClient(network)
    const response = await client.getBalance({ owner: address })
    const raw = response.totalBalance || "0"

    return formatUnits(BigInt(raw), SUI_DECIMALS, 6)
  }

  async signMessage(privateKey: string, message: string) {
    const keypair = parseSuiPrivateKey(privateKey)
    const { signature } = await keypair.signPersonalMessage(utf8ToBytes(message))
    return signature
  }

  async transferNative({
    network,
    privateKey,
    to,
    amount
  }: NativeTransferOptions): Promise<{ hash: string }> {
    const keypair = parseSuiPrivateKey(privateKey)
    const client = createClient(network)

    const mistAmount = parseDecimalToBigInt(amount, SUI_DECIMALS)

    const tx = new TransactionBlock()
    const [coin] = tx.splitCoins(tx.gas, [tx.pure(mistAmount)])
    tx.transferObjects([coin], tx.pure(to))

    const result = await client.signAndExecuteTransactionBlock({
      signer: keypair,
      transactionBlock: tx,
      options: { showEffects: true }
    })

    if (result.effects?.status?.status !== "success") {
      throw new Error(result.effects?.status?.error || "Sui transaction failed")
    }

    return { hash: result.digest }
  }
}

