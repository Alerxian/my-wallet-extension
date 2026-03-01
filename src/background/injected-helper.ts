import type { ChainType, WalletAccount } from "~types/wallet"

interface ChainRequest {
  chain?: ChainType
}

interface TransferRequest extends ChainRequest {
  to: string
  amount: string
  password: string
  gasLimit?: string
  gasPriceGwei?: string
}

interface MyWallet {
  connect: (options?: ChainRequest) => Promise<WalletAccount>
  disconnect: () => Promise<boolean>
  signMessage: (
    message: string,
    options?: ChainRequest
  ) => Promise<string>
  getAccount: (options?: ChainRequest) => Promise<WalletAccount | null>
  getBalance: (options?: ChainRequest) => Promise<{ balance: string; symbol: string }>
  transfer: (params: TransferRequest) => Promise<{ hash: string }>
  switchChain: (chain: ChainType) => Promise<{ chain: ChainType }>
  switchNetwork: (
    networkId: string,
    options?: ChainRequest
  ) => Promise<{ network: unknown }>
}

declare global {
  interface Window {
    ccWallet: MyWallet
    ccWalletInjected: boolean
  }
}

export const injectMyWallet = () => {
  if (window.ccWalletInjected || window.ccWallet) {
    return
  }

  const WALLET_CONNECT = "WALLET_CONNECT"
  const WALLET_GET_ACCOUNT = "WALLET_GET_ACCOUNT"
  const WALLET_SIGN_MESSAGE = "WALLET_SIGN_MESSAGE"
  const WALLET_DISCONNECT = "WALLET_DISCONNECT"
  const WALLET_GET_BALANCE = "WALLET_GET_BALANCE"
  const WALLET_TRANSFER = "WALLET_TRANSFER"
  const WALLET_SWITCH_CHAIN = "WALLET_SWITCH_CHAIN"
  const WALLET_SWITCH_NETWORK = "WALLET_SWITCH_NETWORK"

  const generateRequestId = () => Math.random().toString(36).slice(2, 10)

  const isValidResponse = (event: MessageEvent, requestId: string) =>
    event.source === window &&
    event.data &&
    event.data.requestId === requestId &&
    event.data.from === "message-bridge"

  const request = <T>(type: string, data?: Record<string, unknown>) =>
    new Promise<T>((resolve, reject) => {
      const requestId = generateRequestId()

      const handleResponse = (event: MessageEvent) => {
        if (!isValidResponse(event, requestId)) return

        window.removeEventListener("message", handleResponse)

        if (event.data.success) {
          resolve((event.data.data ?? {}) as T)
        } else {
          reject(new Error(event.data.error || "Wallet request failed"))
        }
      }

      window.addEventListener("message", handleResponse)

      window.postMessage(
        {
          type,
          requestId,
          from: "injected-helper",
          data
        },
        "*"
      )

      setTimeout(() => {
        window.removeEventListener("message", handleResponse)
        reject(new Error("Wallet request timeout"))
      }, 30000)
    })

  const myWallet: MyWallet = {
    connect: async (options) => {
      const response = await request<{ account: WalletAccount }>(WALLET_CONNECT, {
        chain: options?.chain
      })
      return response.account
    },
    disconnect: async () => {
      await request<{ disconnected: boolean }>(WALLET_DISCONNECT)
      return true
    },
    getAccount: async (options) => {
      const response = await request<{ account: WalletAccount | null }>(
        WALLET_GET_ACCOUNT,
        { chain: options?.chain }
      )
      return response.account
    },
    signMessage: async (message, options) => {
      const response = await request<{ signature: string }>(WALLET_SIGN_MESSAGE, {
        message,
        chain: options?.chain
      })
      return response.signature
    },
    getBalance: async (options) => {
      return request<{ balance: string; symbol: string }>(WALLET_GET_BALANCE, {
        chain: options?.chain
      })
    },
    transfer: async (params) => {
      return request<{ hash: string }>(WALLET_TRANSFER, { ...params })
    },
    switchChain: async (chain) => {
      return request<{ chain: ChainType }>(WALLET_SWITCH_CHAIN, { chain })
    },
    switchNetwork: async (networkId, options) => {
      return request<{ network: unknown }>(WALLET_SWITCH_NETWORK, {
        networkId,
        chain: options?.chain
      })
    }
  }

  window.ccWallet = myWallet
  window.ccWalletInjected = true
}

