import { useMemo, useState } from "react"

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
  const currentChain = useWalletStore((state) => state.currentChain)
  const currentAccount = useWalletStore(
    (state) => state.currentAccountByChain[state.currentChain]
  )
  const currentNetwork = useWalletStore(
    (state) => state.currentNetworkByChain[state.currentChain]
  )
  const validateAddress = useWalletStore((state) => state.validateAddress)
  const transferNative = useWalletStore((state) => state.transferNative)
  const { balance, symbol } = useWalletBalance()

  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")
  const [gasLimit, setGasLimit] = useState("21000")
  const [gasPriceGwei, setGasPriceGwei] = useState("20")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [password, setPassword] = useState("")

  const isEvm = currentChain === "EVM"

  const canSubmit = useMemo(() => {
    if (!currentAccount || !currentNetwork) return false
    if (!validateAddress(to, currentChain)) return false
    if (!amount) return false
    const num = Number(amount)
    if (!Number.isFinite(num) || num <= 0) return false
    return true
  }, [
    currentAccount,
    currentNetwork,
    validateAddress,
    to,
    amount,
    currentChain
  ])

  const submit = () => {
    setError(null)
    if (!canSubmit) return
    setConfirmOpen(true)
  }

  const confirmSend = async () => {
    setError(null)
    setTxHash(null)

    if (!currentAccount || !currentNetwork) return
    if (!password) {
      setError("Password is required")
      return
    }

    setLoading(true)
    try {
      const result = await transferNative({
        chain: currentChain,
        to,
        amount,
        password,
        ...(isEvm ? { gasLimit, gasPriceGwei } : {})
      })

      setTxHash(result.hash)
      setConfirmOpen(false)
      setTo("")
      setAmount("")
      setPassword("")
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  if (!currentAccount) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No account on {currentChain}. Create/import one first.
      </div>
    )
  }

  return (
    <div className="p-4 min-h-screen">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>
            Send {symbol} ({currentChain})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Network</Label>
            <div className="text-sm text-muted-foreground">{currentNetwork?.name}</div>
          </div>

          <div className="space-y-2">
            <Label>Recipient Address</Label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value.trim())}
              placeholder="Input recipient address"
            />
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              inputMode="decimal"
              placeholder="0.0"
              value={amount}
              type="number"
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="text-sm text-muted-foreground">
              Balance: {balance} {symbol}
            </div>
          </div>

          {isEvm && (
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
          )}

          {txHash && (
            <div className="text-sm text-green-500 break-all">Tx hash: {txHash}</div>
          )}
          {error && <div className="text-sm text-red-500">{error}</div>}

          <Button className="w-full" disabled={!canSubmit || loading} onClick={submit}>
            Send Transaction
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transaction</DialogTitle>
            <DialogDescription>
              Confirm transfer details and input wallet password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Chain</span>
              <span>{currentChain}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>From</span>
              <span className="break-all text-right">{currentAccount.address}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>To</span>
              <span className="break-all text-right">{to}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount</span>
              <span>
                {amount} {symbol}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label>Wallet Password</Label>
            <Input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Input wallet password"
              value={password}
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void confirmSend()} disabled={loading}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
