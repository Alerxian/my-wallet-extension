import { mnemonicToSeedSync } from "bip39"
import bs58 from "bs58"
import { HDKey } from "micro-ed25519-hdkey"
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction
} from "@solana/web3.js"
import nacl from "tweetnacl"

import {
  fromHex,
  parseDecimalToBigInt,
  parseJsonUint8Array,
  toHex,
  utf8ToBytes
} from "../helpers"
import type { ChainAdapter, NativeTransferOptions } from "../types"

const SOLANA_DERIVATION_PATH = (index: number) => `m/44'/501'/${index}'/0'`
const LAMPORT_DECIMALS = 9

const getKeypairFromHex = (hexKey: string): Keypair => {
  const bytes = fromHex(hexKey)
  if (bytes.length === 64) {
    return Keypair.fromSecretKey(bytes)
  }

  if (bytes.length === 32) {
    return Keypair.fromSeed(bytes)
  }

  throw new Error("Invalid Solana private key length")
}

const parseSolanaPrivateKey = (privateKey: string): Keypair => {
  const normalized = privateKey.trim()
  if (!normalized) {
    throw new Error("Private key is required")
  }

  const fromArray = parseJsonUint8Array(normalized)
  if (fromArray) {
    if (fromArray.length === 64) return Keypair.fromSecretKey(fromArray)
    if (fromArray.length === 32) return Keypair.fromSeed(fromArray)
  }

  if (/^(0x)?[0-9a-fA-F]+$/.test(normalized)) {
    return getKeypairFromHex(normalized)
  }

  try {
    const bytes = bs58.decode(normalized)
    if (bytes.length === 64) return Keypair.fromSecretKey(bytes)
    if (bytes.length === 32) return Keypair.fromSeed(bytes)
  } catch {
    // continue
  }

  throw new Error("Unsupported Solana private key format")
}

export class SolanaAdapter implements ChainAdapter {
  readonly chain = "SOLANA" as const

  async deriveAccountFromMnemonic(mnemonic: string, index: number) {
    const seed = mnemonicToSeedSync(mnemonic)
    const hdKey = HDKey.fromMasterSeed(seed)
    const derived = hdKey.derive(SOLANA_DERIVATION_PATH(index))
    const keypair = Keypair.fromSeed(derived.privateKey)

    return {
      address: keypair.publicKey.toBase58(),
      privateKey: toHex(keypair.secretKey),
      publicKey: keypair.publicKey.toBase58()
    }
  }

  async importPrivateKey(privateKey: string) {
    const keypair = parseSolanaPrivateKey(privateKey)

    return {
      address: keypair.publicKey.toBase58(),
      privateKey: toHex(keypair.secretKey),
      publicKey: keypair.publicKey.toBase58()
    }
  }

  validateAddress(address: string): boolean {
    try {
      new PublicKey(address)
      return true
    } catch {
      return false
    }
  }

  async getBalance(network: NativeTransferOptions["network"], address: string) {
    const connection = new Connection(network.rpcUrl, "confirmed")
    const lamports = await connection.getBalance(new PublicKey(address))
    return (lamports / 10 ** LAMPORT_DECIMALS).toString()
  }

  async signMessage(privateKey: string, message: string) {
    const keypair = parseSolanaPrivateKey(privateKey)
    const signature = nacl.sign.detached(utf8ToBytes(message), keypair.secretKey)
    return bs58.encode(signature)
  }

  async transferNative({
    network,
    privateKey,
    to,
    amount
  }: NativeTransferOptions): Promise<{ hash: string }> {
    const keypair = parseSolanaPrivateKey(privateKey)
    const toPubKey = new PublicKey(to)
    const lamports = parseDecimalToBigInt(amount, LAMPORT_DECIMALS)

    const connection = new Connection(network.rpcUrl, "confirmed")
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: toPubKey,
        lamports
      })
    )

    const hash = await sendAndConfirmTransaction(connection, transaction, [keypair])
    return { hash }
  }
}

