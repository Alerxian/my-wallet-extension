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
      setEthBalance(formatEthBalance(balance))
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

function formatEthBalance(balance: bigint, decimalPlaces = 4) {
  // 1. 转为 ETH 单位的字符串（18 位小数）
  const ethStr = formatEther(balance)
  // 2. 固定小数位数 + 去除末尾的零 + 去除小数点后全零的情况
  let formatted = Number(ethStr)
    .toFixed(decimalPlaces)
    .replace(/\.?0*$/, "")
  // 3. 处理整数情况（如 1 → 1，而非 1.0000）
  if (formatted === "") formatted = "0"
  return formatted
}
