import { Contract, formatEther, isAddress } from "ethers"
import { ImageIcon, RotateCcw, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "~components/ui/dialog"
import { Input } from "~components/ui/input"
import { Label } from "~components/ui/label"
import { useWalletStore } from "~stores/walletStore"

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)"
]
const ERC721_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)"
]
const ERC1155_ABI = ["function balanceOf(address, uint256) view returns (uint256)"]

export const WalletToken = () => {
  const currentChain = useWalletStore((state) => state.currentChain)
  const tokens = useWalletStore((state) => state.tokenByChain.EVM)
  const addToken = useWalletStore((state) => state.addToken)
  const updateTokenBalance = useWalletStore((state) => state.updateTokenBalance)
  const removeToken = useWalletStore((state) => state.removeToken)
  const currentAccount = useWalletStore((state) => state.currentAccountByChain.EVM)
  const getProvider = useWalletStore((state) => state.getProvider)

  const provider = useMemo(() => getProvider("EVM") ?? null, [getProvider])

  const [open, setOpen] = useState(false)
  const [address, setAddress] = useState("")
  const [type, setType] = useState<"ERC20" | "ERC721" | "ERC1155">("ERC20")
  const [tokenId, setTokenId] = useState("")
  const [detecting, setDetecting] = useState(false)
  const [detected, setDetected] = useState<{
    name: string
    symbol: string
    decimals: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    void (async () => {
      if (!provider || !currentAccount?.address || currentChain !== "EVM") return

      for (const token of tokens) {
        try {
          if (token.type === "ERC20") {
            const contract = new Contract(token.address, ERC20_ABI, provider)
            const balance = await contract.balanceOf(currentAccount.address)
            if (mounted)
              updateTokenBalance(token.address, formatEther(balance), undefined, "EVM")
          } else if (token.type === "ERC721") {
            const contract = new Contract(token.address, ERC721_ABI, provider)
            const balance = await contract.balanceOf(currentAccount.address)
            if (mounted)
              updateTokenBalance(token.address, balance.toString(), undefined, "EVM")
          } else if (token.type === "ERC1155" && token.tokenId) {
            const contract = new Contract(token.address, ERC1155_ABI, provider)
            const balance = await contract.balanceOf(
              currentAccount.address,
              BigInt(token.tokenId)
            )
            if (mounted)
              updateTokenBalance(token.address, balance.toString(), token.tokenId, "EVM")
          }
        } catch {
          // ignore individual token errors
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [provider, currentAccount?.address, currentChain, tokens, updateTokenBalance])

  const detect = async () => {
    setError(null)
    if (!provider) return

    if (!isAddress(address)) {
      setError("Please input a valid contract address")
      return
    }

    setDetecting(true)
    try {
      if (type === "ERC20") {
        const contract = new Contract(address, ERC20_ABI, provider)
        const [name, symbol, decimals] = await Promise.all([
          contract.name(),
          contract.symbol(),
          contract.decimals()
        ])
        setDetected({ name, symbol, decimals })
      } else if (type === "ERC721") {
        const contract = new Contract(address, ERC721_ABI, provider)
        const [name, symbol] = await Promise.all([contract.name(), contract.symbol()])
        setDetected({ name, symbol, decimals: 0 })
      } else {
        setDetected({ name: "ERC1155", symbol: "ERC1155", decimals: 0 })
      }
    } catch (e: any) {
      setError(e?.message || "Detect token failed")
    } finally {
      setDetecting(false)
    }
  }

  const handleAdd = () => {
    setError(null)
    if (!detected || !isAddress(address)) {
      setError("Please detect and confirm token info first")
      return
    }

    addToken(
      {
        chain: "EVM",
        networkId: "",
        name: detected.name,
        symbol: detected.symbol,
        decimal: detected.decimals,
        address,
        type,
        ...(type === "ERC1155" ? { tokenId } : {})
      },
      "EVM"
    )

    setOpen(false)
    setAddress("")
    setDetected(null)
    setTokenId("")
  }

  const refreshOne = async (token: any) => {
    if (!provider || !currentAccount?.address) return

    try {
      if (token.type === "ERC20") {
        const contract = new Contract(token.address, ERC20_ABI, provider)
        const balance = await contract.balanceOf(currentAccount.address)
        updateTokenBalance(token.address, formatEther(balance), undefined, "EVM")
      } else if (token.type === "ERC721") {
        const contract = new Contract(token.address, ERC721_ABI, provider)
        const balance = await contract.balanceOf(currentAccount.address)
        updateTokenBalance(token.address, balance.toString(), undefined, "EVM")
      } else if (token.type === "ERC1155" && token.tokenId) {
        const contract = new Contract(token.address, ERC1155_ABI, provider)
        const balance = await contract.balanceOf(currentAccount.address, BigInt(token.tokenId))
        updateTokenBalance(token.address, balance.toString(), token.tokenId, "EVM")
      }
    } catch {
      // ignore refresh failures
    }
  }

  if (currentChain !== "EVM") {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Token management is available in EVM only in this version.
      </div>
    )
  }

  return (
    <div className="p-4 min-h-screen space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Token Management</h1>
        <Button onClick={() => setOpen(true)}>Add Token</Button>
      </div>

      {tokens.length === 0 ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>No token added</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Add ERC20/ERC721/ERC1155 tokens to track balances.
            </p>
            <Button onClick={() => setOpen(true)}>Add First Token</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => (
            <Card key={`${token.address}-${token.tokenId || ""}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{token.symbol}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeToken(token.address, "EVM")}>
                    Remove
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{token.name}</div>
                      <div className="text-sm text-muted-foreground">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground">{token.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold">{token.balance ?? "-"}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => void refreshOne(token)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeToken(token.address, "EVM")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground break-all">
                  {token.address}
                  {token.tokenId ? ` #${token.tokenId}` : ""}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Token</DialogTitle>
            <DialogDescription>
              Input contract address and detect metadata before adding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Contract Address</Label>
              <Input
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value.trim())}
              />
            </div>
            <div className="space-y-2">
              <Label>Token Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={type === "ERC20" ? "default" : "outline"}
                  onClick={() => setType("ERC20")}>
                  ERC-20
                </Button>
                <Button
                  variant={type === "ERC721" ? "default" : "outline"}
                  onClick={() => setType("ERC721")}>
                  ERC-721
                </Button>
                <Button
                  variant={type === "ERC1155" ? "default" : "outline"}
                  onClick={() => setType("ERC1155")}>
                  ERC-1155
                </Button>
              </div>
            </div>

            {type === "ERC1155" && (
              <div className="space-y-2">
                <Label>Token ID</Label>
                <Input
                  placeholder="1"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value.trim())}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => void detect()}
                disabled={detecting || !isAddress(address)}>
                Detect
              </Button>
              {detected && (
                <span className="text-sm text-muted-foreground">
                  {detected.name} / {detected.symbol} / {detected.decimals}
                </span>
              )}
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!detected}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
