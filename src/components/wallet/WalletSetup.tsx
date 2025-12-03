import { Wallet } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"

import { CreateWalletForm } from "./form/WalletForm"

export const WalletSetup = () => {
  return (
    <div className="w-[400px] p-4">
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-purple-300 rounded-xl flex items-center justify-center">
          <Wallet className="w-10 h-10 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">My Wallet</h1>
          <p className="text-gray-500 mt-2">安全、简单的加密货币钱包</p>
        </div>
      </div>

      <Tabs defaultValue="wallet" className="w-full mt-2">
        <TabsList className="w-full">
          <TabsTrigger value="wallet">创建钱包</TabsTrigger>
          <TabsTrigger value="import">导入助记词</TabsTrigger>
          <TabsTrigger value="privateKey">导入私钥</TabsTrigger>
        </TabsList>
        <TabsContent value="wallet">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">创建新钱包</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4 text-base">
                创建新钱包并生成助记词
              </p>
              <CreateWalletForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="import">导入助记词</TabsContent>
        <TabsContent value="privateKey">导入私钥</TabsContent>
      </Tabs>
    </div>
  )
}
