import { AES, enc, SHA256 } from "crypto-js"
import { ethers, JsonRpcProvider, Wallet } from "ethers"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
  DEFAULT_NETWORK,
  type WalletAccount,
  type WalletNetwork,
  type WalletState,
  type WalletToken
} from "~types/wallet"

interface WalletStore extends WalletState {
  // wallet manage
  /** 创建钱包 */
  createWallet: (
    password: string
  ) => Promise<{ mnemonic: string; account: WalletAccount }>
  /** 导入钱包 */
  importWallet: (mnemonic: string, password: string) => Promise<WalletAccount>
  /** 导入私钥 */
  importPrivateKey: (
    privateKey: string,
    password: string,
    name?: string
  ) => Promise<WalletAccount>
  /** 锁定钱包 */
  lockWallet: () => void
  /** 解锁钱包 */
  unlockWallet: (password: string) => boolean

  // account manage
  createAccount: (password: string, name?: string) => Promise<WalletAccount>
  updateAccount: (address: string, name: string) => void
  switchAccount: (address: string) => void

  // network manage
  createNetwork: (network: WalletNetwork) => void
  switchNetwork: (networkId: string) => void

  // token manage
  addToken: (token: WalletToken) => void
  updateTokenBalance: (address: string, balance: string) => void
  removeToken: (address: string) => void
  // util

  getProvider: () => ethers.JsonRpcProvider | null
}

const initialState: WalletState = {
  isLocked: true,
  isConnected: false,
  accounts: [],
  currentAccount: null,
  mnemonic: null,
  password: null,
  networks: DEFAULT_NETWORK,
  currentNetwork: DEFAULT_NETWORK[0],
  token: []
}

export const useWalletStore = create<Partial<WalletStore>>()(
  persist(
    (set, get) => ({
      ...initialState,
      createWallet: async (password) => {
        // 生成助记词 默认12词助记词
        const mnemonic = Wallet.createRandom().mnemonic.phrase
        // 从助记词生成钱包
        const wallet = Wallet.fromPhrase(mnemonic)

        const account: WalletAccount = {
          address: wallet.address,
          privateKey: wallet.privateKey,
          name: "Account 1",
          index: 0
        }

        // 加密助记词
        const encryptedMnemonic = AES.encrypt(mnemonic, password).toString()
        // 加密privateKey
        const encryptedPrivateKey = AES.encrypt(
          wallet.privateKey,
          password
        ).toString()
        const encryptedPassword = SHA256(password).toString()

        set({
          isLocked: false,
          mnemonic: encryptedMnemonic,
          password: encryptedPassword,
          accounts: [{ ...account, privateKey: encryptedPrivateKey }],
          currentAccount: account
        })

        return {
          mnemonic,
          account
        }
      },
      importPrivateKey: async (privateKey, password, name) => {
        try {
          const wallet = new Wallet(privateKey)
          const accounts = get().accounts

          // 检查是否已存在
          const existAccount = accounts.find(
            (a) => a.address === wallet.address
          )
          if (existAccount) {
            throw new Error("Account already exists")
          }

          const encryptedPrivateKey = AES.encrypt(
            wallet.privateKey,
            password
          ).toString()

          const newAccount: WalletAccount = {
            address: wallet.address,
            privateKey: encryptedPrivateKey,
            name: name || `Account ${accounts.length + 1}`,
            index: -1 // -1 表示导入的账户，非 HD 派生
          }

          const newAccounts = [...accounts, newAccount]
          set({
            accounts: newAccounts,
            currentAccount: newAccount
          })
          return newAccount
        } catch (error) {
          console.error("Failed to import private key:", error)
          throw error
        }
      },
      createAccount: async (password, name) => {
        const state = get()
        if (!state.mnemonic) {
          throw new Error("Wallet not initialized")
        }

        try {
          // 解密助记词
          const mnemonicBytes = AES.decrypt(state.mnemonic, password)
          const mnemonic = mnemonicBytes.toString(enc.Utf8)

          if (!mnemonic) {
            throw new Error("密码错误或数据损坏")
          }

          // 找到下一个 HD 索引
          // 过滤掉 index 为 -1 (导入的账户)
          const hdAccounts = state.accounts.filter((a) => a.index !== -1)
          const nextIndex =
            hdAccounts.length > 0
              ? Math.max(...hdAccounts.map((a) => a.index)) + 1
              : 0

          // 从助记词派生新账户
          // path: m/44'/60'/0'/0/index
          const wallet = Wallet.fromPhrase(mnemonic).deriveChild(nextIndex)

          const encryptedPrivateKey = AES.encrypt(
            wallet.privateKey,
            password
          ).toString()

          const newAccount: WalletAccount = {
            address: wallet.address,
            privateKey: encryptedPrivateKey,
            name: name || `Account ${state.accounts.length + 1}`,
            index: nextIndex
          }

          const newAccounts = [...state.accounts, newAccount]
          set({
            accounts: newAccounts,
            currentAccount: newAccount
          })

          return newAccount
        } catch (error) {
          console.error("Failed to create account:", error)
          throw error
        }
      },
      getProvider: () => {
        const state = get()

        if (!state.currentNetwork || !state.currentNetwork.rpcUrl) {
          return null
        }
        try {
          return new JsonRpcProvider(state.currentNetwork.rpcUrl)
        } catch (err) {
          console.error("Failed to create provider:", err)
          return null
        }
      },
      switchNetwork(networkId) {
        const network = get().networks.find((n) => n.id === networkId)
        if (!network) {
          return
        }
        set({ currentNetwork: network })
      },
      switchAccount: (address) => {
        const account = get().accounts.find((a) => a.address === address)
        if (account) {
          set({ currentAccount: account })
        }
      }
    }),
    {
      name: "wallet-store",
      storage: {
        getItem: async (name: string) => {
          const result = await chrome.storage.local.get(name)
          return result[name] || null
        },
        setItem: async (name: string, value: any) => {
          await chrome.storage.local.set({ [name]: value })
        },
        removeItem: async (name: string) => {
          await chrome.storage.local.remove(name)
        }
      },
      partialize: (state) => ({
        isLocked: state.isLocked,
        isConnected: state.isConnected,
        accounts: state.accounts,
        currentAccount: state.currentAccount,
        mnemonic: state.mnemonic,
        password: state.password,
        networks: state.networks,
        currentNetwork: state.currentNetwork,
        token: state.token
      })
    }
  )
)
