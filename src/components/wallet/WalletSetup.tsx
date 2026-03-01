import { Wallet } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~components/ui/tabs"
import { useWalletStore } from "~stores/walletStore"
import { CHAIN_TYPES } from "~types/wallet"
import { Button } from "~components/ui/button"

import {
  CreateWalletForm,
  ImportMnemonicForm,
  ImportPrivateKeyForm
} from "./form/WalletForm"

export const WalletSetup = () => {
  const currentChain = useWalletStore((state) => state.currentChain)
  const setCurrentChain = useWalletStore((state) => state.setCurrentChain)

  return (
    <div className="w-[400px] p-4 min-h-screen">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Wallet className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">My Wallet</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Simple multi-chain wallet for EVM, Solana and Sui
        </p>
      </div>

      <div className="flex gap-2 mt-4">
        {CHAIN_TYPES.map((chain) => (
          <Button
            key={chain}
            variant={currentChain === chain ? "default" : "outline"}
            className="flex-1"
            onClick={() => setCurrentChain(chain)}>
            {chain}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="wallet" className="w-full mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="wallet">Create Wallet</TabsTrigger>
          <TabsTrigger value="import">Import Mnemonic</TabsTrigger>
          <TabsTrigger value="privateKey">Import Private Key</TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Create Wallet</CardTitle>
              <CardDescription>
                Create wallet and first {currentChain} account.
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
              <CardTitle className="text-xl font-bold">Import Mnemonic</CardTitle>
              <CardDescription>
                Import mnemonic and derive first {currentChain} account.
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
              <CardTitle className="text-xl font-bold">Import Private Key</CardTitle>
              <CardDescription>
                Import private key as a {currentChain} account.
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
