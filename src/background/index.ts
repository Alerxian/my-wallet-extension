import { useWalletStore } from "~stores/walletStore"

import {
  WALLET_CONNECT,
  WALLET_DISCONNECT,
  WALLET_GET_ACCOUNT,
  WALLET_GET_BALANCE,
  WALLET_SIGN_MESSAGE,
  WALLET_SWITCH_CHAIN,
  WALLET_SWITCH_NETWORK,
  WALLET_TRANSFER
} from "./constants"
import { injectMyWallet } from "./injected-helper"

const setupMessageListener = () => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const state = useWalletStore.getState()

    const reply = (payload: Record<string, unknown>) => {
      sendResponse({
        requestId: message.requestId,
        ...payload
      })
    }

    const handleAsync = async (handler: () => Promise<any>) => {
      try {
        const data = await handler()
        reply({ success: true, data })
      } catch (error: any) {
        reply({ success: false, error: error?.message || String(error) })
      }
    }

    if (message.type === WALLET_CONNECT) {
      void handleAsync(async () => {
        const account = await state.connect(message.data?.chain)
        return { account }
      })
      return true
    }

    if (message.type === WALLET_GET_ACCOUNT) {
      void handleAsync(async () => {
        const account = state.getCurrentAccount(message.data?.chain)
        return { account }
      })
      return true
    }

    if (message.type === WALLET_SIGN_MESSAGE) {
      void handleAsync(async () => {
        const signature = await state.signMessage(
          message.data?.message,
          message.data?.chain
        )
        return { signature }
      })
      return true
    }

    if (message.type === WALLET_GET_BALANCE) {
      void handleAsync(async () => {
        const result = await state.getNativeBalance(message.data?.chain)
        return result
      })
      return true
    }

    if (message.type === WALLET_TRANSFER) {
      void handleAsync(async () => {
        const tx = await state.transferNative({
          to: message.data?.to,
          amount: message.data?.amount,
          password: message.data?.password,
          chain: message.data?.chain,
          gasLimit: message.data?.gasLimit,
          gasPriceGwei: message.data?.gasPriceGwei
        })

        return tx
      })
      return true
    }

    if (message.type === WALLET_SWITCH_CHAIN) {
      void handleAsync(async () => {
        if (!message.data?.chain) {
          throw new Error("chain is required")
        }

        state.setCurrentChain(message.data.chain)
        return {
          chain: message.data.chain,
          account: state.getCurrentAccount(message.data.chain),
          network: state.getCurrentNetwork(message.data.chain)
        }
      })
      return true
    }

    if (message.type === WALLET_SWITCH_NETWORK) {
      void handleAsync(async () => {
        state.switchNetwork(message.data?.networkId, message.data?.chain)
        return {
          network: state.getCurrentNetwork(message.data?.chain)
        }
      })
      return true
    }

    if (message.type === WALLET_DISCONNECT) {
      state.disconnect()
      reply({ success: true, data: { disconnected: true } })
      return true
    }

    reply({ success: false, error: "Unsupported message type" })
    return true
  })
}

const setupScriptInjection = () => {
  const shouldInject = (url?: string) =>
    Boolean(url && !url.startsWith("chrome://") && !url.startsWith("chrome-extension://"))

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && shouldInject(tab.url)) {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          world: "MAIN",
          func: injectMyWallet
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Failed to inject wallet script", chrome.runtime.lastError)
          }
        }
      )
    }
  })

  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (shouldInject(tab.url)) {
        chrome.scripting.executeScript(
          {
            target: { tabId: activeInfo.tabId },
            world: "MAIN",
            func: injectMyWallet
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error("Failed to inject wallet script", chrome.runtime.lastError)
            }
          }
        )
      }
    })
  })
}

setupMessageListener()
setupScriptInjection()
