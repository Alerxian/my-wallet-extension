import { AES, enc, SHA256 } from "crypto-js"
import { HDNodeWallet, JsonRpcProvider } from "ethers"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import { getChainAdapter } from "~chains"
import type { ChainType } from "~types/wallet"
import {
  CHAIN_TYPES,
  cloneDefaultNetworks,
  createEmptyChainRecord,
  type ChainRecord,
  type ConnectedSite,
  type WalletAccount,
  type WalletNetwork,
  type WalletState,
  type WalletToken
} from "~types/wallet"

interface TransferNativeParams {
  to: string
  amount: string
  password: string
  chain?: ChainType
  gasLimit?: string
  gasPriceGwei?: string
}

interface WalletStore extends WalletState {
  createWallet: (
    password: string,
    chain?: ChainType
  ) => Promise<{ mnemonic: string; account: WalletAccount }>
  importWallet: (
    mnemonic: string,
    password: string,
    chain?: ChainType
  ) => Promise<WalletAccount>
  importPrivateKey: (
    privateKey: string,
    password: string,
    name?: string,
    chain?: ChainType
  ) => Promise<WalletAccount>
  lockWallet: () => void
  unlockWallet: (password: string) => boolean

  createAccount: (
    password: string,
    name?: string,
    chain?: ChainType
  ) => Promise<WalletAccount>
  updateAccountName: (address: string, name: string, chain?: ChainType) => void
  switchAccount: (address: string, chain?: ChainType) => void

  addNetwork: (network: WalletNetwork, chain?: ChainType) => void
  switchNetwork: (networkId: string, chain?: ChainType) => void

  addToken: (token: WalletToken, chain?: ChainType) => void
  updateTokenBalance: (
    address: string,
    balance: string,
    tokenId?: string,
    chain?: ChainType
  ) => void
  removeToken: (address: string, chain?: ChainType) => void
  addConnectedSite: (site: ConnectedSite) => void
  removeConnectedSite: (origin: string, chain?: ChainType) => void

  getProvider: (chain?: ChainType) => JsonRpcProvider | null
  getNativeBalance: (
    chain?: ChainType
  ) => Promise<{ balance: string; symbol: string }>
  transferNative: (params: TransferNativeParams) => Promise<{ hash: string }>
  validateAddress: (address: string, chain?: ChainType) => boolean

  setCurrentChain: (chain: ChainType) => void
  getAccounts: (chain?: ChainType) => WalletAccount[]
  getCurrentAccount: (chain?: ChainType) => WalletAccount | null
  getNetworks: (chain?: ChainType) => WalletNetwork[]
  getCurrentNetwork: (chain?: ChainType) => WalletNetwork | null
  getTokens: (chain?: ChainType) => WalletToken[]
  hasAnyAccount: () => boolean

  connect: (chain?: ChainType) => Promise<WalletAccount>
  signMessage: (message: string, chain?: ChainType) => Promise<string>
  disconnect: () => void
  isValidPassword: (password: string) => boolean
}

const buildInitialState = (): WalletState => {
  const networksByChain = cloneDefaultNetworks()

  return {
    isLocked: false,
    isConnected: false,
    currentChain: "EVM",
    mnemonic: null,
    password: null,
    accountsByChain: createEmptyChainRecord(() => []),
    currentAccountByChain: createEmptyChainRecord(() => null),
    networksByChain,
    currentNetworkByChain: {
      EVM: networksByChain.EVM[0] || null,
      SOLANA: networksByChain.SOLANA[0] || null,
      SUI: networksByChain.SUI[0] || null
    },
    tokenByChain: createEmptyChainRecord(() => []),
    connectedSites: []
  }
}

const normalizeNetwork = (
  network: Partial<WalletNetwork>,
  chain: ChainType
): WalletNetwork => ({
  id: String(network.id ?? ""),
  chain,
  name: String(network.name ?? "Unnamed Network"),
  rpcUrl: String(network.rpcUrl ?? ""),
  chainId: network.chainId,
  symbol: String(network.symbol ?? (chain === "SOLANA" ? "SOL" : chain === "SUI" ? "SUI" : "ETH")),
  decimals:
    typeof network.decimals === "number"
      ? network.decimals
      : chain === "EVM"
        ? 18
        : 9,
  ...(network.blockExplorerUrl ? { blockExplorerUrl: network.blockExplorerUrl } : {}),
  ...(network.metadata ? { metadata: network.metadata } : {})
})

const ensureChain = (state: WalletState, chain?: ChainType): ChainType =>
  chain || state.currentChain

const decryptPrivateKey = (
  encryptedPrivateKey: string,
  encryptedPassword: string
): string => {
  const decrypted = AES.decrypt(encryptedPrivateKey, encryptedPassword).toString(enc.Utf8)
  if (!decrypted) {
    throw new Error("Failed to decrypt private key")
  }
  return decrypted
}

const migratePersistedState = (persisted: any): WalletState => {
  const initial = buildInitialState()
  if (!persisted || typeof persisted !== "object") {
    return initial
  }

  if (
    persisted.accountsByChain &&
    persisted.currentAccountByChain &&
    persisted.networksByChain &&
    persisted.currentNetworkByChain &&
    persisted.tokenByChain
  ) {
    const normalizedAccounts: ChainRecord<WalletAccount[]> = createEmptyChainRecord(() => [])
    const normalizedCurrentAccounts: ChainRecord<WalletAccount | null> =
      createEmptyChainRecord(() => null)
    const normalizedNetworks: ChainRecord<WalletNetwork[]> = createEmptyChainRecord(() => [])
    const normalizedCurrentNetworks: ChainRecord<WalletNetwork | null> =
      createEmptyChainRecord(() => null)
    const normalizedTokens: ChainRecord<WalletToken[]> = createEmptyChainRecord(() => [])

    for (const chain of CHAIN_TYPES) {
      normalizedAccounts[chain] = (persisted.accountsByChain?.[chain] || []).map(
        (account: WalletAccount) => ({ ...account, chain })
      )

      const current = persisted.currentAccountByChain?.[chain]
      normalizedCurrentAccounts[chain] = current ? { ...current, chain } : null

      const networks = (persisted.networksByChain?.[chain] || []).map(
        (network: WalletNetwork) => normalizeNetwork(network, chain)
      )
      normalizedNetworks[chain] =
        networks.length > 0
          ? networks
          : initial.networksByChain[chain].map((network) => ({ ...network }))

      normalizedCurrentNetworks[chain] = persisted.currentNetworkByChain?.[chain]
        ? normalizeNetwork(persisted.currentNetworkByChain[chain], chain)
        : normalizedNetworks[chain][0] || null

      normalizedTokens[chain] = (persisted.tokenByChain?.[chain] || []).map(
        (token: WalletToken) => ({ ...token, chain })
      )
    }

    return {
      ...initial,
      ...persisted,
      currentChain: CHAIN_TYPES.includes(persisted.currentChain)
        ? persisted.currentChain
        : "EVM",
      accountsByChain: normalizedAccounts,
      currentAccountByChain: normalizedCurrentAccounts,
      networksByChain: normalizedNetworks,
      currentNetworkByChain: normalizedCurrentNetworks,
      tokenByChain: normalizedTokens,
      connectedSites: (persisted.connectedSites || []).map((site: ConnectedSite) => ({
        ...site,
        chain: site.chain || "EVM"
      }))
    }
  }

  const legacyAccounts: WalletAccount[] = (persisted.accounts || []).map(
    (account: WalletAccount) => ({
      ...account,
      chain: "EVM"
    })
  )

  const legacyCurrentAccount = persisted.currentAccount
    ? { ...persisted.currentAccount, chain: "EVM" }
    : null

  const legacyNetworks = (persisted.networks || initial.networksByChain.EVM).map(
    (network: WalletNetwork) => normalizeNetwork(network, "EVM")
  )

  const legacyCurrentNetwork = persisted.currentNetwork
    ? normalizeNetwork(persisted.currentNetwork, "EVM")
    : legacyNetworks[0] || null

  const legacyTokens = (persisted.token || []).map((token: WalletToken) => ({
    ...token,
    chain: "EVM"
  }))

  return {
    ...initial,
    isLocked: Boolean(persisted.isLocked),
    isConnected: Boolean(persisted.isConnected),
    mnemonic: persisted.mnemonic || null,
    password: persisted.password || null,
    currentChain: "EVM",
    accountsByChain: {
      ...initial.accountsByChain,
      EVM: legacyAccounts
    },
    currentAccountByChain: {
      ...initial.currentAccountByChain,
      EVM: legacyCurrentAccount
    },
    networksByChain: {
      ...initial.networksByChain,
      EVM: legacyNetworks
    },
    currentNetworkByChain: {
      ...initial.currentNetworkByChain,
      EVM: legacyCurrentNetwork
    },
    tokenByChain: {
      ...initial.tokenByChain,
      EVM: legacyTokens
    },
    connectedSites: (persisted.connectedSites || []).map((site: ConnectedSite) => ({
      ...site,
      chain: site.chain || "EVM"
    }))
  }
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),
      createWallet: async (password, chain) => {
        const state = get()
        if (state.hasAnyAccount()) {
          throw new Error("Wallet already exists")
        }

        const targetChain = ensureChain(state, chain)
        const adapter = getChainAdapter(targetChain)

        const mnemonic = HDNodeWallet.createRandom().mnemonic?.phrase
        if (!mnemonic) {
          throw new Error("Failed to generate mnemonic")
        }

        const created = await adapter.deriveAccountFromMnemonic(mnemonic, 0)
        const encryptedPassword = SHA256(password).toString()
        const encryptedMnemonic = AES.encrypt(mnemonic, encryptedPassword).toString()
        const encryptedPrivateKey = AES.encrypt(
          created.privateKey,
          encryptedPassword
        ).toString()

        const account: WalletAccount = {
          chain: targetChain,
          address: created.address,
          privateKey: encryptedPrivateKey,
          publicKey: created.publicKey,
          name: "Account 1",
          index: 0
        }

        set((prev) => ({
          mnemonic: encryptedMnemonic,
          password: encryptedPassword,
          currentChain: targetChain,
          isLocked: false,
          accountsByChain: {
            ...prev.accountsByChain,
            [targetChain]: [account]
          },
          currentAccountByChain: {
            ...prev.currentAccountByChain,
            [targetChain]: account
          }
        }))

        return { mnemonic, account }
      },
      importWallet: async (mnemonic, password, chain) => {
        const state = get()
        if (state.hasAnyAccount()) {
          throw new Error("Wallet already exists")
        }

        const targetChain = ensureChain(state, chain)
        const adapter = getChainAdapter(targetChain)

        let created
        try {
          created = await adapter.deriveAccountFromMnemonic(mnemonic.trim(), 0)
        } catch {
          throw new Error("Invalid mnemonic")
        }

        const encryptedPassword = SHA256(password).toString()
        const encryptedMnemonic = AES.encrypt(
          mnemonic.trim(),
          encryptedPassword
        ).toString()
        const encryptedPrivateKey = AES.encrypt(
          created.privateKey,
          encryptedPassword
        ).toString()

        const account: WalletAccount = {
          chain: targetChain,
          address: created.address,
          privateKey: encryptedPrivateKey,
          publicKey: created.publicKey,
          name: "Account 1",
          index: 0
        }

        set((prev) => ({
          mnemonic: encryptedMnemonic,
          password: encryptedPassword,
          currentChain: targetChain,
          isLocked: false,
          accountsByChain: {
            ...prev.accountsByChain,
            [targetChain]: [account]
          },
          currentAccountByChain: {
            ...prev.currentAccountByChain,
            [targetChain]: account
          }
        }))

        return account
      },
      importPrivateKey: async (privateKey, password, name, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)

        const encryptedPassword = state.password || SHA256(password).toString()
        const inputPasswordHash = SHA256(password).toString()
        if (state.password && inputPasswordHash !== state.password) {
          throw new Error("Invalid password")
        }

        const adapter = getChainAdapter(targetChain)
        const imported = await adapter.importPrivateKey(privateKey)

        const existingAccounts = state.accountsByChain[targetChain]
        const duplicate = existingAccounts.find(
          (account) =>
            account.address.toLowerCase() === imported.address.toLowerCase()
        )
        if (duplicate) {
          throw new Error("Account already exists")
        }

        const encryptedPrivateKey = AES.encrypt(
          imported.privateKey,
          encryptedPassword
        ).toString()

        const account: WalletAccount = {
          chain: targetChain,
          address: imported.address,
          privateKey: encryptedPrivateKey,
          publicKey: imported.publicKey,
          name: name || `Account ${existingAccounts.length + 1}`,
          index: -1
        }

        const updatedAccounts = [...existingAccounts, account]

        set((prev) => ({
          currentChain: targetChain,
          isLocked: false,
          password: encryptedPassword,
          accountsByChain: {
            ...prev.accountsByChain,
            [targetChain]: updatedAccounts
          },
          currentAccountByChain: {
            ...prev.currentAccountByChain,
            [targetChain]: account
          }
        }))

        return account
      },
      lockWallet: () => {
        set({ isLocked: true, isConnected: false })
      },
      unlockWallet: (password) => {
        const state = get()
        if (!state.isValidPassword(password)) return false

        set({ isLocked: false })
        return true
      },
      createAccount: async (password, name, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)

        if (!state.isValidPassword(password)) {
          throw new Error("Invalid password")
        }

        if (!state.mnemonic || !state.password) {
          throw new Error("Mnemonic not available")
        }

        const mnemonic = AES.decrypt(state.mnemonic, state.password).toString(enc.Utf8)
        if (!mnemonic) {
          throw new Error("Failed to decrypt mnemonic")
        }

        const accounts = state.accountsByChain[targetChain]
        const hdAccounts = accounts.filter((account) => account.index >= 0)
        const nextIndex =
          hdAccounts.length > 0
            ? Math.max(...hdAccounts.map((account) => account.index)) + 1
            : 0

        const adapter = getChainAdapter(targetChain)
        const created = await adapter.deriveAccountFromMnemonic(mnemonic, nextIndex)

        const duplicate = accounts.find(
          (account) =>
            account.address.toLowerCase() === created.address.toLowerCase()
        )
        if (duplicate) {
          throw new Error("Account already exists")
        }

        const encryptedPrivateKey = AES.encrypt(
          created.privateKey,
          state.password
        ).toString()

        const newAccount: WalletAccount = {
          chain: targetChain,
          address: created.address,
          privateKey: encryptedPrivateKey,
          publicKey: created.publicKey,
          name: name || `Account ${accounts.length + 1}`,
          index: nextIndex
        }

        set((prev) => ({
          currentChain: targetChain,
          accountsByChain: {
            ...prev.accountsByChain,
            [targetChain]: [...accounts, newAccount]
          },
          currentAccountByChain: {
            ...prev.currentAccountByChain,
            [targetChain]: newAccount
          }
        }))

        return newAccount
      },
      updateAccountName: (address, name, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        const accounts = state.accountsByChain[targetChain].map((account) =>
          account.address === address ? { ...account, name } : account
        )

        const current = state.currentAccountByChain[targetChain]

        set((prev) => ({
          accountsByChain: {
            ...prev.accountsByChain,
            [targetChain]: accounts
          },
          currentAccountByChain: {
            ...prev.currentAccountByChain,
            [targetChain]:
              current?.address === address ? { ...current, name } : current
          }
        }))
      },
      switchAccount: (address, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        const account = state.accountsByChain[targetChain].find(
          (item) => item.address === address
        )

        if (!account) return

        set((prev) => ({
          currentChain: targetChain,
          currentAccountByChain: {
            ...prev.currentAccountByChain,
            [targetChain]: account
          }
        }))
      },
      getProvider: (chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        if (targetChain !== "EVM") {
          return null
        }

        const network = state.currentNetworkByChain.EVM
        if (!network?.rpcUrl) {
          return null
        }

        try {
          return new JsonRpcProvider(network.rpcUrl)
        } catch (error) {
          console.error("Failed to create EVM provider", error)
          return null
        }
      },
      addNetwork: (network, chain) => {
        const state = get()
        const targetChain = chain || network.chain || state.currentChain
        const normalized = normalizeNetwork(network, targetChain)
        const networks = state.networksByChain[targetChain]

        if (networks.find((item) => item.id === normalized.id)) {
          return
        }

        set((prev) => ({
          networksByChain: {
            ...prev.networksByChain,
            [targetChain]: [...networks, normalized]
          }
        }))
      },
      switchNetwork: (networkId, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        const network = state.networksByChain[targetChain].find(
          (item) => item.id === networkId
        )

        if (!network) {
          throw new Error("Network not found")
        }

        set((prev) => ({
          currentChain: targetChain,
          currentNetworkByChain: {
            ...prev.currentNetworkByChain,
            [targetChain]: network
          }
        }))
      },
      addToken: (token, chain) => {
        const state = get()
        const targetChain = chain || token.chain || state.currentChain
        const tokens = state.tokenByChain[targetChain]

        const exists = tokens.find(
          (item) =>
            item.address.toLowerCase() === token.address.toLowerCase() &&
            (item.tokenId || "") === (token.tokenId || "")
        )

        if (exists) {
          return
        }

        set((prev) => ({
          tokenByChain: {
            ...prev.tokenByChain,
            [targetChain]: [...tokens, { ...token, chain: targetChain }]
          }
        }))
      },
      updateTokenBalance: (address, balance, tokenId, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        const updated = state.tokenByChain[targetChain].map((token) => {
          const matchAddress =
            token.address.toLowerCase() === address.toLowerCase()
          const matchTokenId = tokenId ? token.tokenId === tokenId : true
          return matchAddress && matchTokenId ? { ...token, balance } : token
        })

        set((prev) => ({
          tokenByChain: {
            ...prev.tokenByChain,
            [targetChain]: updated
          }
        }))
      },
      removeToken: (address, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        const next = state.tokenByChain[targetChain].filter(
          (token) => token.address.toLowerCase() !== address.toLowerCase()
        )

        set((prev) => ({
          tokenByChain: {
            ...prev.tokenByChain,
            [targetChain]: next
          }
        }))
      },
      addConnectedSite: (site) => {
        const state = get()
        const exists = state.connectedSites.find(
          (item) => item.origin === site.origin && item.chain === site.chain
        )

        if (exists) return

        set({ connectedSites: [...state.connectedSites, site] })
      },
      removeConnectedSite: (origin, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)

        set({
          connectedSites: state.connectedSites.filter(
            (site) => !(site.origin === origin && site.chain === targetChain)
          )
        })
      },
      getNativeBalance: async (chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        const account = state.currentAccountByChain[targetChain]
        const network = state.currentNetworkByChain[targetChain]

        if (!account) {
          throw new Error("No account selected")
        }

        if (!network) {
          throw new Error("No network selected")
        }

        const adapter = getChainAdapter(targetChain)
        const balance = await adapter.getBalance(network, account.address)
        return {
          balance,
          symbol: network.symbol
        }
      },
      transferNative: async ({
        to,
        amount,
        password,
        chain,
        gasLimit,
        gasPriceGwei
      }) => {
        const state = get()
        const targetChain = ensureChain(state, chain)

        if (!state.isValidPassword(password)) {
          throw new Error("Invalid password")
        }

        const account = state.currentAccountByChain[targetChain]
        const network = state.currentNetworkByChain[targetChain]

        if (!account) {
          throw new Error("No account selected")
        }

        if (!network) {
          throw new Error("No network selected")
        }

        const adapter = getChainAdapter(targetChain)
        if (!adapter.validateAddress(to)) {
          throw new Error("Invalid recipient address")
        }

        const privateKey = decryptPrivateKey(account.privateKey, state.password as string)

        return adapter.transferNative({
          network,
          privateKey,
          to,
          amount,
          gasLimit,
          gasPriceGwei
        })
      },
      validateAddress: (address, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        return getChainAdapter(targetChain).validateAddress(address)
      },
      isValidPassword: (password) => {
        const state = get()
        if (!state.password) return false
        return SHA256(password).toString() === state.password
      },
      setCurrentChain: (chain) => {
        set({ currentChain: chain })
      },
      getAccounts: (chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        return state.accountsByChain[targetChain]
      },
      getCurrentAccount: (chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        return state.currentAccountByChain[targetChain]
      },
      getNetworks: (chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        return state.networksByChain[targetChain]
      },
      getCurrentNetwork: (chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        return state.currentNetworkByChain[targetChain]
      },
      getTokens: (chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        return state.tokenByChain[targetChain]
      },
      hasAnyAccount: () => {
        const state = get()
        return CHAIN_TYPES.some(
          (chain) => state.accountsByChain[chain].length > 0
        )
      },
      connect: async (chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        const account = state.currentAccountByChain[targetChain]

        if (!account) {
          throw new Error("No account selected")
        }

        set({ isConnected: true, currentChain: targetChain })
        return account
      },
      disconnect: () => {
        set({ isConnected: false })
      },
      signMessage: async (message, chain) => {
        const state = get()
        const targetChain = ensureChain(state, chain)
        const account = state.currentAccountByChain[targetChain]

        if (!account) {
          throw new Error("No account selected")
        }

        if (!state.password) {
          throw new Error("Wallet password not initialized")
        }

        const privateKey = decryptPrivateKey(account.privateKey, state.password)
        const adapter = getChainAdapter(targetChain)
        return adapter.signMessage(privateKey, message)
      }
    }),
    {
      name: "wallet-store",
      version: 2,
      migrate: async (persistedState) => migratePersistedState(persistedState),
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
        currentChain: state.currentChain,
        accountsByChain: state.accountsByChain,
        currentAccountByChain: state.currentAccountByChain,
        mnemonic: state.mnemonic,
        password: state.password,
        networksByChain: state.networksByChain,
        currentNetworkByChain: state.currentNetworkByChain,
        tokenByChain: state.tokenByChain,
        connectedSites: state.connectedSites
      })
    }
  )
)
