import { AES, enc, SHA256 } from "crypto-js"
import { formatEther, isAddress, parseEther, parseUnits, Wallet } from "ethers"
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
import { useWalletBalance } from "~hooks/useWalletBalance"
import { useWalletStore } from "~stores/walletStore"

export const WalletTransfer = () => {
  const currentAccount = useWalletStore((s) => s.currentAccount)
  const getProvider = useWalletStore((s) => s.getProvider)
  const { ethBalance: balance } = useWalletBalance()

  const [asset, setAsset] = useState<"ETH">("ETH")
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")
  const [gasLimit, setGasLimit] = useState("21000")
  const [gasPriceGwei, setGasPriceGwei] = useState("20")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [password, setPassword] = useState("")

  const provider = useMemo(() => getProvider?.() ?? null, [getProvider])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value)
  }

  const setMax = () => {
    // 预留基础 gas 费用
    try {
      const gasPriceWei = BigInt(Math.floor(Number(gasPriceGwei) * 1e9))
      const baseGas = BigInt(gasLimit)
      const fee = gasPriceWei * baseGas
      const balWei = parseEther(balance)
      const maxWei = balWei > fee ? balWei - fee : 0n
      setAmount(maxWei === 0n ? "" : formatEther(maxWei))
    } catch {
      setAmount("")
    }
  }

  const canSubmit = useMemo(() => {
    if (!currentAccount || !provider) return false
    if (!isAddress(to)) return false
    if (!amount) return false
    const num = Number(amount)
    if (!Number.isFinite(num) || num <= 0) return false
    return true
  }, [currentAccount, provider, to, amount])

  const submit = () => {
    setError(null)
    if (!canSubmit || !provider || !currentAccount) return
    setConfirmOpen(true)
  }

  const confirmSend = async () => {
    setError(null)
    if (!provider || !currentAccount) return
    const state = useWalletStore.getState()
    if (!state.isValidPassword(password)) {
      setError("密码错误")
      return
    }
    setLoading(true)
    try {
      // 解密私钥（使用密码哈希作为密钥，不存储明文密码）
      const inputHash = SHA256(password).toString()
      const dec = AES.decrypt(currentAccount.privateKey, inputHash).toString(enc.Utf8)
      if (!dec) throw new Error("无法解密私钥")

      const signer = new Wallet(dec).connect(provider)
      const tx = await signer.sendTransaction({
        to,
        value: parseEther(amount),
        gasLimit: BigInt(gasLimit),
        gasPrice: parseUnits(gasPriceGwei, "gwei")
      })
      await tx.wait()
      setConfirmOpen(false)
      resetForm()
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTo("")
    setAmount("")
    setGasLimit("21000")
    setGasPriceGwei("20")
    setPassword("")
  }

  return (
    <div className="p-4 min-h-screen">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>发送 {asset}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>选择资产</Label>
            <Button variant="outline" className="w-full">
              {asset}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>接收地址</Label>
            <Input
              placeholder="0x..."
              value={to}
              onChange={(e) => setTo(e.target.value.trim())}
            />
          </div>

          <div className="space-y-2">
            <Label>金额</Label>
            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                type="number"
                onChange={(e) => handleAmountChange(e)}
              />
              <Button variant="outline" onClick={setMax}>
                全部
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              余额: {balance} ETH
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gas Limit</Label>
              <Input
                value={gasLimit}
                onChange={(e) => setGasLimit(e.target.value)}
              />
            </div>
            <div>
              <Label>Gas Price (Gwei)</Label>
              <Input
                value={gasPriceGwei}
                onChange={(e) => setGasPriceGwei(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <Button
            className="w-full"
            disabled={!canSubmit || loading}
            onClick={submit}>
            发送交易
          </Button>
        </CardContent>
      </Card>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认发送交易</DialogTitle>
            <DialogDescription>
              请确认以下交易信息并输入钱包密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>资产</span>
              <span>{asset}</span>
            </div>
            <div className="flex justify-between">
              <span>From</span>
              <span>{currentAccount?.address}</span>
            </div>
            <div className="flex justify-between">
              <span>To</span>
              <span>{to}</span>
            </div>
            <div className="flex justify-between">
              <span>金额</span>
              <span>{amount} ETH</span>
            </div>
            <div className="flex justify-between">
              <span>Gas Limit</span>
              <span>{gasLimit}</span>
            </div>
            <div className="flex justify-between">
              <span>Gas Price</span>
              <span>{gasPriceGwei} Gwei</span>
            </div>
            <div className="flex justify-between">
              <span>预计手续费</span>
              <span>
                {(() => {
                  try {
                    const feeWei =
                      BigInt(Math.floor(Number(gasPriceGwei) * 1e9)) *
                      BigInt(gasLimit)
                    return formatEther(feeWei)
                  } catch {
                    return "-"
                  }
                })()}{" "}
                ETH
              </span>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <Label>钱包密码</Label>
            <Input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入钱包密码"
            />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmSend} disabled={loading}>
              确认发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
