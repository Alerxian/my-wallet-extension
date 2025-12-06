import { Wallet } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"

import {
  CreateWalletForm,
  ImportMnemonicForm,
  ImportPrivateKeyForm
} from "./form/WalletForm"

export const WalletSetup = () => {
  return (
    <div className="w-[400px] p-4 min-h-screen">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Wallet className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">My Wallet</h1>
        </div>
        <p className="text-gray-500 text-sm">安全、简单的加密货币钱包</p>
      </div>

      <Tabs defaultValue="wallet" className="w-full mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="wallet">创建钱包</TabsTrigger>
          <TabsTrigger value="import">导入助记词</TabsTrigger>
          <TabsTrigger value="privateKey">导入私钥</TabsTrigger>
        </TabsList>
        <TabsContent value="wallet">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">创建新钱包</CardTitle>
              <CardDescription>
                <p className="text-base">创建新钱包并生成助记词</p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateWalletForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="import">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">导入助记词</CardTitle>
              <CardDescription>
                <p className="text-base">导入已有的助记词钱包</p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportMnemonicForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="privateKey">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">导入私钥</CardTitle>
              <CardDescription>
                <p className="text-base">使用私钥导入账户</p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportPrivateKeyForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
