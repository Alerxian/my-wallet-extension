import { WalletDashboard } from "~components/wallet/WalletDashboard"
import { WalletSetup } from "~components/wallet/WalletSetup"
import { useWalletStore } from "~stores/walletStore"

export const Index = () => {
  const { accounts, isLocked } = useWalletStore()

  if (accounts.length === 0) {
    return <WalletSetup />
  }

  if (isLocked) {
    return (
      <div className="text-center text-2xl font-bold text-red-500 w-[400px] min-h-screen">
        请先解锁钱包
      </div>
    )
  }
  return <WalletDashboard />
}
