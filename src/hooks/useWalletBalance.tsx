import { formatEther } from "ethers"
import { useCallback, useEffect, useState } from "react"

import { useWalletStore } from "~stores/walletStore"

export const useWalletBalance = () => {
  const getProvider = useWalletStore((s) => s.getProvider)
  const currentAccount = useWalletStore((s) => s.currentAccount)
  const currentNetwork = useWalletStore((s) => s.currentNetwork)

  const [ethBalance, setEthBalance] = useState("0")
  const [isLoading, setIsLoading] = useState(false)

  const fetchEthBalance = useCallback(async () => {
    if (!currentAccount || !currentNetwork || !getProvider) return

    setIsLoading(true)
    try {
      const provider = getProvider()
      if (!provider) return

      const balance = await provider.getBalance(currentAccount.address)
      console.log("balance", balance)
      setEthBalance(formatEther(balance))
    } catch (error) {
      console.error("Failed to fetch ETH balance:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentAccount, currentNetwork, getProvider])

  const fetchAllTokenBalances = useCallback(async () => {}, [])

  const refreshBalances = useCallback(async () => {
    await Promise.all([fetchEthBalance(), fetchAllTokenBalances()])
  }, [fetchEthBalance, fetchAllTokenBalances])

  useEffect(() => {
    refreshBalances()
  }, [refreshBalances])

  return {
    ethBalance,
    isLoading,
    refreshBalances
  }
}
