import bs58 from "bs58"
import { verifyMessage } from "ethers"
import nacl from "tweetnacl"
import { describe, expect, it } from "vitest"

import { EvmAdapter } from "../adapters/evm"
import { SolanaAdapter } from "../adapters/solana"
import { SuiAdapter } from "../adapters/sui"

const MNEMONIC = "test test test test test test test test test test test junk"

describe("chain adapters", () => {
  it("EVM derive/import/sign/validate", async () => {
    const adapter = new EvmAdapter()
    const account = await adapter.deriveAccountFromMnemonic(MNEMONIC, 0)
    const imported = await adapter.importPrivateKey(account.privateKey)

    expect(imported.address).toBe(account.address)
    expect(adapter.validateAddress(account.address)).toBe(true)
    expect(adapter.validateAddress("not-an-address")).toBe(false)

    const message = "hello-evm"
    const signature = await adapter.signMessage(account.privateKey, message)
    expect(verifyMessage(message, signature)).toBe(account.address)
  })

  it("Solana derive/import/sign/validate", async () => {
    const adapter = new SolanaAdapter()
    const account = await adapter.deriveAccountFromMnemonic(MNEMONIC, 0)
    const imported = await adapter.importPrivateKey(account.privateKey)

    expect(imported.address).toBe(account.address)
    expect(adapter.validateAddress(account.address)).toBe(true)
    expect(adapter.validateAddress("bad-sol-address")).toBe(false)

    const message = "hello-sol"
    const signature = await adapter.signMessage(account.privateKey, message)

    const isValid = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      bs58.decode(signature),
      bs58.decode(account.publicKey as string)
    )

    expect(isValid).toBe(true)
  })

  it("Sui derive/import/sign/validate", async () => {
    const adapter = new SuiAdapter()
    const account = await adapter.deriveAccountFromMnemonic(MNEMONIC, 0)
    const imported = await adapter.importPrivateKey(account.privateKey)

    expect(imported.address).toBe(account.address)
    expect(adapter.validateAddress(account.address)).toBe(true)
    expect(adapter.validateAddress("0x123")).toBe(false)

    const message = "hello-sui"
    const signature = await adapter.signMessage(account.privateKey, message)

    expect(typeof signature).toBe("string")
    expect(signature.length).toBeGreaterThan(0)
  })
})
