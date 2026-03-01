import { WalletDashboard } from "~components/wallet/WalletDashboard"
import { WalletSetup } from "~components/wallet/WalletSetup"
import { useWalletStore } from "~stores/walletStore"

export const Index = () => {
  const isLocked = useWalletStore((state) => state.isLocked)
  const hasAnyAccount = useWalletStore((state) => state.hasAnyAccount())

  if (!hasAnyAccount) {
    return <WalletSetup />
  }

  if (isLocked) {
    return (
      <div className="text-center text-xl font-semibold text-red-500 w-[400px] min-h-screen p-6">
        Wallet is locked. Please unlock first.
      </div>
    )
  }

  return <WalletDashboard />
}
