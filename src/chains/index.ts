import type { ChainAdapter } from "./types"
import type { ChainType } from "../types/wallet"

import { EvmAdapter } from "./adapters/evm"
import { SolanaAdapter } from "./adapters/solana"
import { SuiAdapter } from "./adapters/sui"

const adapters: Record<ChainType, ChainAdapter> = {
  EVM: new EvmAdapter(),
  SOLANA: new SolanaAdapter(),
  SUI: new SuiAdapter()
}

export const getChainAdapter = (chain: ChainType): ChainAdapter => adapters[chain]

