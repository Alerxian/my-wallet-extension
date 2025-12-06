import { TabsContent } from "@radix-ui/react-tabs"
import {
  ArrowRightLeft,
  Coins,
  Globe,
  LayoutDashboard,
  Wallet
} from "lucide-react"
import { useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "~components/ui/tabs"

import { WalletAccount } from "./WalletAccount"
import { WalletNetwork } from "./WalletNetwork"
import { WalletOverview } from "./WalletOverview"
import { WalletToken } from "./WalletToken"
import { WalletTransfer } from "./WalletTransfer"

export const WalletDashboard = () => {
  const [activeTab, setActiveTab] = useState("all")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="p-4 min-h-screen">
      {/* header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">钱包管理</h1>
      </div>
      <Tabs
        defaultValue="all"
        value={activeTab}
        className="w-full mt-4"
        onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            总览
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Wallet className="h-4 w-4" />
            账户
          </TabsTrigger>
          <TabsTrigger value="network" className="gap-2">
            <Globe className="h-4 w-4" />
            网络
          </TabsTrigger>
          <TabsTrigger value="token" className="gap-2">
            <Coins className="h-4 w-4" />
            代币
          </TabsTrigger>
          <TabsTrigger value="transfer" className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            转账
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <WalletOverview onTabChange={handleTabChange} />
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
