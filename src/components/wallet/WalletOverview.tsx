import copyToClipboard from "copy-to-clipboard"
import { formatEther } from "ethers"
import { CopyIcon, RefreshCcw } from "lucide-react"

import { Button } from "~components/ui/button"
import { Card, CardContent } from "~components/ui/card"
import { Spinner } from "~components/ui/spinner"
import { useWalletBalance } from "~hooks/useWalletBalance"
import { truncateAddress } from "~lib/utils"
import { useWalletStore } from "~stores/walletStore"

export function WalletOverview({
  onTabChange
}: {
  onTabChange: (value: string) => void
}) {
  const currentNetwork = useWalletStore((s) => s.currentNetwork)
  const currentAccount = useWalletStore((s) => s.currentAccount)
  const { ethBalance, refreshBalances, isLoading } = useWalletBalance()

  return (
    <div className="w-full">
      <Card className="mt-4">
        <CardContent>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-base">当前账户</span>
              <div>{currentNetwork?.name}</div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl font-bold">{currentAccount.name}</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(currentAccount.address)}>
                <CopyIcon size={18} />
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {truncateAddress(currentAccount.address)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent>
          <div className="p-4">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-base">当前余额</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshBalances}
                disabled={isLoading}>
                <RefreshCcw size={18} />
              </Button>
            </div>
            <div className="text-2xl font-bold flex items-center gap-2">
              {ethBalance} ETH
              {isLoading && <Spinner />}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 mt-4 w-full">
        <Button
          size="lg"
          className="flex-1 min-w-0"
          onClick={() => {
            onTabChange("transfer")
          }}>
          转账
        </Button>
        <Button
          size="lg"
          className="flex-1 min-w-0"
          onClick={() => {
            onTabChange("token")
          }}>
          添加代币
        </Button>
      </div>
    </div>
  )
}
