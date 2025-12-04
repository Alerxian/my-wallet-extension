// 初始化钱包状态

import { useWalletStore } from "~stores/walletStore"

import {
  WALLET_CONNECT,
  WALLET_DISCONNECT,
  WALLET_GET_ACCOUNT,
  WALLET_SIGN_MESSAGE
} from "./constants"
import { injectMyWallet } from "./injected-helper"

console.log("Background SW 启动，注册监听") // 同步执行
// 注册消息监听器
const setupMessageListener = () => {
  console.log("监听来自 message-bridge 的消息")
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("background 收到消息 cc-wallet:", message, sender)
    if (message.type === WALLET_CONNECT) {
      const state = useWalletStore.getState()
      try {
        state
          .connect()
          .then(() => {
            console.log("连接成功", state.currentAccount)
            sendResponse({
              success: true,
              data: { account: state.currentAccount }
            })
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message })
          })
      } catch (error) {
        sendResponse({ success: false, error: error.message })
      }

      return true
    }

    // 获取当前连接的账户
    if (message.type === WALLET_GET_ACCOUNT) {
      const state = useWalletStore.getState()
      sendResponse({ success: true, data: { account: state.currentAccount } })
      return true
    }

    // 签名消息
    if (message.type === WALLET_SIGN_MESSAGE) {
      if (!message.data || !message.data.message) {
        sendResponse({ success: false, error: "消息格式错误" })
        return true
      }
      const state = useWalletStore.getState()
      try {
        state
          .signMessage(message.data.message)
          .then((signedMessage) => {
            sendResponse({ success: true, data: { signedMessage } })
          })
          .catch((error) => {
            sendResponse({ success: false, error: error.message })
          })
      } catch (error) {
        sendResponse({ success: false, error: error.message })
      }

      return true
    }

    // 断开连接
    if (message.type === WALLET_DISCONNECT) {
      const state = useWalletStore.getState()
      state.disconnect()
      sendResponse({ success: true })
      return true
    }
  })
}

// 注入钱包脚本到页面
const setupScriptInjection = () => {
  // console.log("设置脚本注入 setup-----")
  // 当页面加载完成时注入
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // console.log("tabId:", tabId, "changeInfo:", changeInfo, "tab:", tab)
    if (changeInfo.status === "complete" && !tab.url?.startsWith("chrome://")) {
      console.log("页面加载完成，注入钱包脚本")
      chrome.scripting.executeScript(
        {
          target: { tabId },
          world: "MAIN",
          func: injectMyWallet
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "❌ Background script: 注入失败",
              chrome.runtime.lastError
            )
          } else {
            console.log("✅ Background script: ccWallet 注入完成")
          }
        }
      )
    }
  })

  // 当标签页激活时也注入（备用机制）
  chrome.tabs.onActivated.addListener((e) => {
    chrome.tabs.get(e.tabId, (tab) => {
      if (tab.url && !tab.url.startsWith("chrome://")) {
        console.log("🔄 标签页激活，注入 ccWallet:", tab.url)
        chrome.scripting.executeScript(
          {
            target: { tabId: e.tabId },
            world: "MAIN",
            func: injectMyWallet
          },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                "❌ Background script: 注入失败",
                chrome.runtime.lastError
              )
            } else {
              console.log("✅ Background script: ccWallet 注入完成")
            }
          }
        )
      }
    })
  })
}

setupMessageListener()
setupScriptInjection()

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.log("🔄 扩展安装事件:", details.reason)
  if (details.reason === "install") {
    // 执行安装时的操作
    console.log("🔄 扩展安装完成")
  }
})
