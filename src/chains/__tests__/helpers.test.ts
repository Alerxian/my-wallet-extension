import { describe, expect, it } from "vitest"

import { formatUnits, fromHex, parseDecimalToBigInt, toHex } from "../helpers"

describe("chains/helpers", () => {
  it("parses decimal strings into base units", () => {
    expect(parseDecimalToBigInt("1", 9)).toBe(1000000000n)
    expect(parseDecimalToBigInt("1.23", 9)).toBe(1230000000n)
    expect(parseDecimalToBigInt("0.000001", 9)).toBe(1000n)
  })

  it("formats base units", () => {
    expect(formatUnits(1000000000n, 9)).toBe("1")
    expect(formatUnits(1234567890n, 9, 6)).toBe("1.234567")
    expect(formatUnits(1000n, 9, 9)).toBe("0.000001")
  })

  it("encodes and decodes hex", () => {
    const bytes = new Uint8Array([1, 2, 3, 255])
    const hex = toHex(bytes)
    expect(hex).toBe("010203ff")
    expect(Array.from(fromHex(hex))).toEqual([1, 2, 3, 255])
    expect(Array.from(fromHex(`0x${hex}`))).toEqual([1, 2, 3, 255])
  })
})
