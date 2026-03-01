import { useCallback, useEffect, useState } from "react"

import { useWalletStore } from "~stores/walletStore"

export const useWalletBalance = () => {
  const currentChain = useWalletStore((state) => state.currentChain)
  const currentAccount = useWalletStore(
    (state) => state.currentAccountByChain[state.currentChain]
  )
  const currentNetwork = useWalletStore(
    (state) => state.currentNetworkByChain[state.currentChain]
  )
  const getNativeBalance = useWalletStore((state) => state.getNativeBalance)

  const [balance, setBalance] = useState("0")
  const [symbol, setSymbol] = useState("-")
  const [isLoading, setIsLoading] = useState(false)

  const refreshBalances = useCallback(async () => {
    if (!currentAccount || !currentNetwork) {
      setBalance("0")
      setSymbol(currentNetwork?.symbol || "-")
      return
    }

    setIsLoading(true)
    try {
      const result = await getNativeBalance(currentChain)
      setBalance(result.balance)
      setSymbol(result.symbol)
    } catch (error) {
      console.error("Failed to fetch native balance", error)
      setBalance("0")
      setSymbol(currentNetwork.symbol)
    } finally {
      setIsLoading(false)
    }
  }, [currentAccount, currentNetwork, getNativeBalance, currentChain])

  useEffect(() => {
    void refreshBalances()
  }, [refreshBalances])

  return {
    balance,
    symbol,
    isLoading,
    refreshBalances
  }
}
