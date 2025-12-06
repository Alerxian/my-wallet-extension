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
const ERC1155_ABI = [
  "function balanceOf(address, uint256) view returns (uint256)"
]

export const WalletToken = () => {
  const tokens = useWalletStore((s) => s.token)
  const addToken = useWalletStore((s) => s.addToken)
  const updateTokenBalance = useWalletStore((s) => s.updateTokenBalance)
  const removeToken = useWalletStore((s) => s.removeToken)
  const currentAccount = useWalletStore((s) => s.currentAccount)
  const getProvider = useWalletStore((s) => s.getProvider)

  const provider = useMemo(() => getProvider?.() ?? null, [getProvider])

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
    ;(async () => {
      if (!provider || !currentAccount?.address) return
      for (const t of tokens) {
        try {
          if (t.type === "ERC20") {
            const c = new Contract(t.address, ERC20_ABI, provider)
            const bal = await c.balanceOf(currentAccount.address)
            if (mounted) updateTokenBalance(t.address, formatEther(bal))
          } else if (t.type === "ERC721") {
            const c = new Contract(t.address, ERC721_ABI, provider)
            const bal = await c.balanceOf(currentAccount.address)
            if (mounted) updateTokenBalance(t.address, bal.toString())
          } else if (t.type === "ERC1155" && t.tokenId) {
            const c = new Contract(t.address, ERC1155_ABI, provider)
            const bal = await c.balanceOf(
              currentAccount.address,
              BigInt(t.tokenId)
            )
            if (mounted)
              updateTokenBalance(t.address, bal.toString(), t.tokenId)
          }
        } catch {}
      }
    })()
    return () => {
      mounted = false
    }
  }, [provider, currentAccount?.address])

  const detect = async () => {
    setError(null)
    if (!provider) return
    if (!isAddress(address)) {
      setError("请输入有效的合约地址")
      return
    }
    setDetecting(true)
    try {
      if (type === "ERC20") {
        const c = new Contract(address, ERC20_ABI, provider)
        const [name, symbol, decimals] = await Promise.all([
          c.name(),
          c.symbol(),
          c.decimals()
        ])
        setDetected({ name, symbol, decimals })
      } else if (type === "ERC721") {
        const c = new Contract(address, ERC721_ABI, provider)
        const [name, symbol] = await Promise.all([c.name(), c.symbol()])
        setDetected({ name, symbol, decimals: 0 })
      } else {
        setDetected({ name: "ERC1155", symbol: "ERC1155", decimals: 0 })
      }
    } catch (e: any) {
      setError(e?.message || "检测失败")
    } finally {
      setDetecting(false)
    }
  }

  const handleAdd = async () => {
    setError(null)
    if (!detected || !isAddress(address)) {
      setError("请先检测并确认代币信息")
      return
    }
    if (type === "ERC20") {
      addToken({
        name: detected.name,
        symbol: detected.symbol,
        decimal: detected.decimals,
        address,
        type: "ERC20"
      })
    } else if (type === "ERC721") {
      addToken({
        name: detected.name,
        symbol: detected.symbol,
        decimal: 0,
        address,
        type: "ERC721"
      })
    } else {
      addToken({
        name: "ERC1155",
        symbol: "ERC1155",
        decimal: 0,
        address,
        type: "ERC1155",
        tokenId
      })
    }
    setOpen(false)
    setAddress("")
    setDetected(null)
  }

  const refreshOne = async (t: any) => {
    if (!provider || !currentAccount?.address) return
    try {
      if (t.type === "ERC20") {
        const c = new Contract(t.address, ERC20_ABI, provider)
        const bal = await c.balanceOf(currentAccount.address)
        updateTokenBalance(t.address, formatEther(bal))
      } else if (t.type === "ERC721") {
        const c = new Contract(t.address, ERC721_ABI, provider)
        const bal = await c.balanceOf(currentAccount.address)
        updateTokenBalance(t.address, bal.toString())
      } else if (t.type === "ERC1155" && t.tokenId) {
        const c = new Contract(t.address, ERC1155_ABI, provider)
        const bal = await c.balanceOf(currentAccount.address, BigInt(t.tokenId))
        updateTokenBalance(t.address, bal.toString(), t.tokenId)
      }
    } catch {}
  }

  return (
    <div className="p-4 min-h-screen space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">代币管理</h1>
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)}>添加代币</Button>
        </div>
      </div>

      {tokens.length === 0 ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>暂无代币</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              添加 ERC-20、ERC-721 或 ERC-1155 代币来管理您的资产
            </p>
            <Button onClick={() => setOpen(true)}>添加第一个代币</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map((t) => (
            <Card key={t.address}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t.symbol}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeToken(t.address)}>
                    移除
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
                      <div className="font-medium">{t.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {t.symbol}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {t.type === "ERC20"
                          ? t.balance ?? "-"
                          : t.balance ?? "0"}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => refreshOne(t)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeToken(t.address)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground break-all">
                  {t.address}
                  {t.tokenId ? ` #${t.tokenId}` : ""}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加代币</DialogTitle>
            <DialogDescription>
              支持 ERC-20，输入合约地址后可检测代币信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>合约地址</Label>
              <Input
                placeholder="0x..."
                value={address}
                onChange={(e) => setAddress(e.target.value.trim())}
              />
            </div>
            <div className="space-y-2">
              <Label>代币类型</Label>
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
                  placeholder="例如: 1"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value.trim())}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={detect}
                disabled={detecting || !isAddress(address)}>
                检测
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
              取消
            </Button>
            <Button onClick={handleAdd} disabled={!detected}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
