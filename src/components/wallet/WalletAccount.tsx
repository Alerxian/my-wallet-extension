import { Check, Wallet } from "lucide-react"

import { cn, truncateAddress } from "~lib/utils"
import { useWalletStore } from "~stores/walletStore"

import { CreateAccountDialog, ImportPrivateKeyDialog } from "./AccountDialogs"

export const WalletAccount = () => {
  const accounts = useWalletStore((state) => state.accounts)
  const currentAccount = useWalletStore((state) => state.currentAccount)
  const switchAccount = useWalletStore((state) => state.switchAccount)

  return (
    <div className="w-full space-y-4 mt-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold">我的账户</h2>
        <div className="flex gap-2">
          <CreateAccountDialog />
          <ImportPrivateKeyDialog />
        </div>
      </div>

      <div className="grid gap-3">
        {accounts.map((account) => {
          const isActive = currentAccount?.address === account.address
          const isImported = account.index === -1
          return (
            <div
              key={account.address}
              onClick={() => switchAccount(account.address)}
              className={cn(
                "relative flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all hover:bg-accent/50",
                isActive
                  ? "border-primary/50 bg-accent shadow-sm"
                  : "border-transparent bg-card shadow-sm hover:border-border"
              )}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border",
                    isActive
                      ? "border-primary/20 bg-primary/10 text-primary"
                      : "border-muted bg-muted/50 text-muted-foreground"
                  )}>
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{account.name}</span>
                    {isImported && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        导入
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {truncateAddress(account.address, 8, 8)}
                  </span>
                </div>
              </div>

              {isActive && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
