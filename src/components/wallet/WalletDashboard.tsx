import { TabsContent } from "@radix-ui/react-tabs"
import {
  ArrowRightLeft,
  Coins,
  Globe,
  LayoutDashboard,
  Wallet
} from "lucide-react"
import { useState } from "react"

import { Button } from "~components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "~components/ui/tabs"
import { CHAIN_TYPES } from "~types/wallet"
import { useWalletStore } from "~stores/walletStore"

import { WalletAccount } from "./WalletAccount"
import { WalletNetwork } from "./WalletNetwork"
import { WalletOverview } from "./WalletOverview"
import { WalletToken } from "./WalletToken"
import { WalletTransfer } from "./WalletTransfer"

const chainLabelMap = {
  EVM: "EVM",
  SOLANA: "SOL",
  SUI: "SUI"
}

export const WalletDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const currentChain = useWalletStore((state) => state.currentChain)
  const setCurrentChain = useWalletStore((state) => state.setCurrentChain)

  return (
    <div className="p-4 min-h-screen w-[400px]">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">My Wallet</h1>
        <div className="flex items-center gap-1">
          {CHAIN_TYPES.map((chain) => (
            <Button
              key={chain}
              size="sm"
              variant={currentChain === chain ? "default" : "outline"}
              onClick={() => setCurrentChain(chain)}>
              {chainLabelMap[chain]}
            </Button>
          ))}
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        className="w-full mt-4"
        onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Wallet className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="network" className="gap-2">
            <Globe className="h-4 w-4" />
            Network
          </TabsTrigger>
          <TabsTrigger value="token" className="gap-2">
            <Coins className="h-4 w-4" />
            Token
          </TabsTrigger>
          <TabsTrigger value="transfer" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Transfer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <WalletOverview onTabChange={setActiveTab} />
        </TabsContent>
        <TabsContent value="token">
          <WalletToken />
        </TabsContent>
        <TabsContent value="transfer">
          <WalletTransfer />
        </TabsContent>
        <TabsContent value="account">
          <WalletAccount />
        </TabsContent>
        <TabsContent value="network">
          <WalletNetwork />
        </TabsContent>
      </Tabs>
    </div>
  )
}
