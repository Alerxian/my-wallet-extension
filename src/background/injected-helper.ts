import type { WalletAccount } from "~types/wallet"

interface MyWallet {
  connect: () => Promise<WalletAccount>
  disconnect: () => Promise<boolean>
  signMessage: (message: string) => Promise<string>
  getAccount: () => Promise<WalletAccount | null>
}

declare global {
  interface Window {
    ccWallet: MyWallet
    ccWalletInjected: boolean
  }
}

// 不支持访问外部变量，必须时纯函数
export const injectMyWallet = () => {
  console.log("钱包脚本注入成功")
  if (window.ccWalletInjected || window.ccWallet) {
    return
  }

  const WALLET_CONNECT = "WALLET_CONNECT"
  const WALLET_GET_ACCOUNT = "WALLET_GET_ACCOUNT"
  const WALLET_SIGN_MESSAGE = "WALLET_SIGN_MESSAGE"
  const WALLET_DISCONNECT = "WALLET_DISCONNECT"

  const generateRequestId = () => {
    return Math.random().toString(36).substring(2, 10)
  }

  const myWallet: MyWallet = {
    connect: () => {
      return new Promise((resolve, reject) => {
        const requestId = generateRequestId()

        // 向桥接发送连接请求
        const message = {
          type: WALLET_CONNECT,
          requestId,
          from: "injected-helper"
        }
        window.postMessage(message, "*")

        const handleResponse = (event: MessageEvent) => {
          if (!isValidResponse(event, requestId)) return

          // 清除监听
          window.removeEventListener("message", handleResponse)
          console.log(event.data, "event.data------")
          // 解析响应
          const response = event.data
          if (response.success) {
            resolve(response.data.account)
          } else {
            reject(new Error(response.error || "连接失败"))
          }
        }

        window.addEventListener("message", handleResponse)

        // 超时连接
        setTimeout(() => {
          window.removeEventListener("message", handleResponse)
          reject(new Error("连接超时"))
        }, 30000)
      })
    },
    disconnect: () => {
      return new Promise((resolve) => {
        const requestId = generateRequestId()

        // 向桥接发送断开连接请求
        const message = {
          type: WALLET_DISCONNECT,
          requestId,
          from: "injected-helper"
        }
        window.postMessage(message, "*")

        const handleResponse = (event: MessageEvent) => {
          if (!isValidResponse(event, requestId)) return
          // 清除监听
          window.removeEventListener("message", handleResponse)
          resolve(true)
        }
        window.addEventListener("message", handleResponse)
      })
    },
    getAccount: () => {
      return new Promise((resolve) => {
        const requestId = generateRequestId()

        // 向桥接发送获取账户请求
        const message = {
          type: WALLET_GET_ACCOUNT,
          requestId,
          from: "injected-helper"
        }
        window.postMessage(message, "*")

        const handleResponse = (event: MessageEvent) => {
          if (!isValidResponse(event, requestId)) return
          // 清除监听
          window.removeEventListener("message", handleResponse)

          if (event.data.success) {
            resolve(event.data.data.account)
          } else {
            resolve(null)
          }
        }
        window.addEventListener("message", handleResponse)
      })
    },
    signMessage: (message: string) => {
      console.log("signMessage", message)
      return new Promise((resolve, reject) => {
        const requestId = generateRequestId()

        // 向桥接发送签名消息请求
        const messageData = {
          type: WALLET_SIGN_MESSAGE,
          requestId,
          from: "injected-helper",
          data: { message }
        }
        window.postMessage(messageData, window.location.origin)

        const handleResponse = (event: MessageEvent) => {
          if (!isValidResponse(event, requestId)) return
          // 清除监听
          window.removeEventListener("message", handleResponse)
          console.log(event.data, "event.data signMessage------")
          if (event.data.success) {
            resolve(event.data.data.signedMessage)
          } else {
            reject(new Error(event.data.error || "签名失败"))
          }
        }
        window.addEventListener("message", handleResponse)

        setTimeout(() => {
          window.removeEventListener("message", handleResponse)
          reject(new Error("签名超时"))
        }, 30000)
      })
    }
  }

  // 判断是否是有效响应
  const isValidResponse = (event: MessageEvent, requestId: string) => {
    return (
      event.source === window &&
      event.data &&
      event.data.requestId === requestId &&
      event.data.from === "message-bridge"
    )
  }

  window.ccWallet = myWallet
  window.ccWalletInjected = true
}
