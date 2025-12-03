import { WalletDashboard } from "~components/wallet/WalletDashboard"
import { WalletSetup } from "~components/wallet/WalletSetup"
import { useWalletStore } from "~stores/walletStore"

export const Index = () => {
  const { accounts, isLocked } = useWalletStore()

  if (accounts.length === 0) {
    return <WalletSetup />
  }

  if (isLocked) {
    return <div>请先解锁钱包</div>
  }
  return <WalletDashboard />
}
