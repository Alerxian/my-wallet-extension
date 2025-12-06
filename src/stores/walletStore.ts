import { AES, enc, SHA256 } from "crypto-js"
import { ethers, HDNodeWallet, JsonRpcProvider, Mnemonic, Wallet } from "ethers"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
  DEFAULT_NETWORK,
  type ConnectedSite,
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
  updateAccountName: (address: string, name: string) => void
  switchAccount: (address: string) => void

  // network manage
  addNetwork: (network: WalletNetwork) => void
  switchNetwork: (networkId: string) => void

  // token manage
  addToken: (token: WalletToken) => void
  updateTokenBalance: (address: string, balance: string) => void
  removeToken: (address: string) => void
  addConnectedSite: (site: ConnectedSite) => void
  removeConnectedSite: (origin: string) => void

  // util
  getProvider: () => ethers.JsonRpcProvider | null

  // 拓展
  connect: () => Promise<WalletAccount>
  signMessage: (message: string) => Promise<string>
  disconnect: () => void
  isValidPassword: (password: string) => boolean
}

const initialState: WalletState = {
  isLocked: false,
  isConnected: false,
  accounts: [],
  currentAccount: null,
  mnemonic: null,
  password: null,
  networks: DEFAULT_NETWORK,
  currentNetwork: DEFAULT_NETWORK[0],
  token: [],
  connectedSites: []
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      createWallet: async (password) => {
        // 生成助记词 默认12词助记词
        const mnemonic = HDNodeWallet.createRandom().mnemonic.phrase
        // console.log(password, mnemonic)
        // 从助记词生成钱包
        const wallet = HDNodeWallet.fromPhrase(mnemonic)

        const account: WalletAccount = {
          address: wallet.address,
          privateKey: wallet.privateKey,
          name: "Account 1",
          index: 0
        }

        const encryptedPassword = SHA256(password).toString()
        // 加密助记词
        const encryptedMnemonic = AES.encrypt(
          mnemonic,
          encryptedPassword
        ).toString()
        // 加密privateKey
        const encryptedPrivateKey = AES.encrypt(
          wallet.privateKey,
          encryptedPassword
        ).toString()

        set({
          isLocked: false,
          mnemonic: encryptedMnemonic,
          password: encryptedPassword,
          accounts: [{ ...account, privateKey: encryptedPrivateKey }],
          currentAccount: { ...account, privateKey: encryptedPrivateKey }
        })
        console.log(mnemonic, account, "account")
        return {
          mnemonic,
          account
        }
      },
      // 使用现有助记词导入钱包
      importWallet: async (mnemonic, password) => {
        // 检查助记词是否有效
        let mnemonicInstance: HDNodeWallet
        try {
          mnemonicInstance = HDNodeWallet.fromPhrase(mnemonic)
        } catch {
          throw new Error("Invalid mnemonic")
        }

        // 从助记词派生新账户
        // path: m/44'/60'/0'/0/index
        const wallet = mnemonicInstance.deriveChild(0)
        const account: WalletAccount = {
          address: wallet.address,
          privateKey: wallet.privateKey,
          name: "Account 1",
          index: 0
        }

        const encryptedPassword = SHA256(password).toString()
        // 加密助记词
        const encryptedMnemonic = AES.encrypt(
          mnemonic,
          encryptedPassword
        ).toString()
        // 加密privateKey
        const encryptedPrivateKey = AES.encrypt(
          wallet.privateKey,
          encryptedPassword
        ).toString()

        set({
          isLocked: false,
          mnemonic: encryptedMnemonic,
          password: encryptedPassword,
          accounts: [{ ...account, privateKey: encryptedPrivateKey }],
          currentAccount: { ...account, privateKey: encryptedPrivateKey }
        })
        console.log(mnemonic, account, "account")
        return account
      },
      importPrivateKey: async (privateKey, password, name) => {
        try {
          const wallet = new Wallet(privateKey)
          const accounts = get().accounts

          const newAccount: WalletAccount = {
            address: wallet.address,
            privateKey: wallet.privateKey,
            name: name || `Account ${accounts.length + 1}`,
            index: accounts.length
          }

          const encryptedPassword = SHA256(password).toString()
          const encryptedPrivateKey = AES.encrypt(
            wallet.privateKey,
            encryptedPassword
          ).toString()

          const newAccounts = [
            ...accounts,
            { ...newAccount, privateKey: encryptedPrivateKey }
          ]
          console.log(newAccount)
          set({
            accounts: newAccounts,
            currentAccount: { ...newAccount, privateKey: encryptedPrivateKey },
            isLocked: false,
            password: encryptedPassword
          })
          return newAccount
        } catch (error) {
          console.error("Failed to import private key:", error)
          throw error
        }
      },
      lockWallet: () => {
        set({ isLocked: true })
      },
      unlockWallet: (password) => {
        const state = get()
        if (!state.isValidPassword(password)) return false

        set({ isLocked: false })
        return true
      },
      createAccount: async (password, name) => {
        const state = get()
        if (!state.mnemonic) {
          throw new Error("Wallet not initialized")
        }
        if (!state.isValidPassword(password)) {
          throw new Error("密码错误")
        }

        try {
          const mnemonicBytes = AES.decrypt(state.mnemonic, state.password)
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
            state.password
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
      addNetwork: (network) => {
        const networks = get().networks
        const exists = networks.find((n) => n.id === network.id)
        if (!exists) {
          set({ networks: [...networks, network] })
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
      },
      updateAccountName: (address, name) => {
        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.address === address ? { ...acc, name } : acc
          ),
          currentAccount: { ...state.currentAccount, name }
        }))
      },
      addToken: (token) => {
        const tokens = get().token
        const exists = tokens.find(
          (t) => t.address.toLowerCase() === token.address.toLowerCase()
        )
        if (!exists) {
          set({ token: [...tokens, token] })
        }
      },
      updateTokenBalance: (address, balance) => {
        const tokens = get().token
        const next = tokens.map((t) =>
          t.address.toLowerCase() === address.toLowerCase()
            ? { ...t, balance }
            : t
        )
        set({ token: next })
      },
      removeToken: (address) => {
        const tokens = get().token
        set({
          token: tokens.filter(
            (t) => t.address.toLowerCase() !== address.toLowerCase()
          )
        })
      },
      addConnectedSite: (site) => {
        const { connectedSites } = get()
        const exists = connectedSites.find((s) => s.origin === site.origin)
        if (!exists) {
          set({ connectedSites: [...connectedSites, site] })
        }
      },
      removeConnectedSite: (origin) => {
        const { connectedSites } = get()
        set({
          connectedSites: connectedSites.filter((s) => s.origin !== origin)
        })
      },
      isValidPassword: (password: string) => {
        const state = get()
        const inputHash = SHA256(password).toString()
        return inputHash === state.password
      },
      connect: async () => {
        const state = get()
        if (!state.currentAccount) {
          throw new Error("No account selected")
        }
        set({ isConnected: true, currentAccount: state.currentAccount })
        return state.currentAccount
      },
      disconnect: () => {
        set({ isConnected: false })
      },
      signMessage: (message) => {
        const state = get()
        if (!state.currentAccount) {
          throw new Error("No account selected")
        }

        // 解密获得privateKey
        const privateKey = AES.decrypt(
          state.currentAccount.privateKey,
          state.password
        ).toString(enc.Utf8)

        if (!privateKey) {
          throw new Error("密码错误或数据损坏")
        }

        const wallet = new Wallet(privateKey)
        return wallet.signMessage(message)
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
        token: state.token,
        connectedSites: state.connectedSites
      })
    }
  )
)
