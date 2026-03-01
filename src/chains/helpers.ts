const textEncoder = new TextEncoder()

export const utf8ToBytes = (value: string): Uint8Array => textEncoder.encode(value)

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

export const fromHex = (value: string): Uint8Array => {
  const normalized = value.startsWith("0x") ? value.slice(2) : value
  if (!/^[0-9a-fA-F]*$/.test(normalized) || normalized.length % 2 !== 0) {
    throw new Error("Invalid hex string")
  }

  const bytes = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16)
  }
  return bytes
}

export const parseDecimalToBigInt = (amount: string, decimals: number): bigint => {
  const normalized = amount.trim()
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Invalid amount")
  }

  const [intPart, fracPart = ""] = normalized.split(".")
  if (fracPart.length > decimals) {
    throw new Error(`Amount exceeds ${decimals} decimals`)
  }

  const paddedFrac = fracPart.padEnd(decimals, "0")
  const merged = `${intPart}${paddedFrac}`.replace(/^0+/, "")
  return BigInt(merged === "" ? "0" : merged)
}

export const formatUnits = (
  value: bigint,
  decimals: number,
  precision = Math.min(decimals, 6)
): string => {
  const negative = value < 0n
  const raw = negative ? -value : value

  const divisor = 10n ** BigInt(decimals)
  const intPart = raw / divisor
  const fracPart = raw % divisor

  if (decimals === 0) {
    return `${negative ? "-" : ""}${intPart.toString()}`
  }

  const frac = fracPart.toString().padStart(decimals, "0")
  const limitedFrac = precision > 0 ? frac.slice(0, precision) : ""
  const cleanedFrac = limitedFrac.replace(/0+$/, "")

  return cleanedFrac
    ? `${negative ? "-" : ""}${intPart.toString()}.${cleanedFrac}`
    : `${negative ? "-" : ""}${intPart.toString()}`
}

export const parseJsonUint8Array = (value: string): Uint8Array | null => {
  const trimmed = value.trim()
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (!Array.isArray(parsed)) return null
    if (!parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
      return null
    }
    return Uint8Array.from(parsed)
  } catch {
    return null
  }
}
