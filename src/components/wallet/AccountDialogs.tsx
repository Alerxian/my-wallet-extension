import { SHA256 } from "crypto-js"
import { Loader2, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "~components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "~components/ui/dialog"
import { Input } from "~components/ui/input"
import { Label } from "~components/ui/label"
import { useWalletStore } from "~stores/walletStore"

export const CreateAccountDialog = () => {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const currentChain = useWalletStore((state) => state.currentChain)
  const createAccount = useWalletStore((state) => state.createAccount)
  const storedPassword = useWalletStore((state) => state.password)

  const handleCreate = async () => {
    if (!password) {
      toast.error("Please input wallet password")
      return
    }

    setIsLoading(true)
    try {
      const inputHash = SHA256(password).toString()
      if (inputHash !== storedPassword) {
        throw new Error("Invalid password")
      }

      await createAccount(password, name || undefined, currentChain)
      toast.success(`Account created on ${currentChain}`)
      setOpen(false)
      setName("")
      setPassword("")
    } catch (error) {
      toast.error(`Create account failed: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">Create</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>
            Create a new {currentChain} account from wallet mnemonic.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Account Name (optional)</Label>
            <Input
              id="name"
              placeholder="Account 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-password">Wallet Password</Label>
            <Input
              id="create-password"
              type="password"
              placeholder="Input current wallet password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const ImportPrivateKeyDialog = () => {
  const [open, setOpen] = useState(false)
  const [privateKey, setPrivateKey] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const currentChain = useWalletStore((state) => state.currentChain)
  const importPrivateKey = useWalletStore((state) => state.importPrivateKey)
  const storedPassword = useWalletStore((state) => state.password)

  const handleImport = async () => {
    if (!privateKey) {
      toast.error("Please input private key")
      return
    }
    if (!password) {
      toast.error("Please input wallet password")
      return
    }

    setIsLoading(true)
    try {
      const inputHash = SHA256(password).toString()
      if (storedPassword && inputHash !== storedPassword) {
        throw new Error("Invalid password")
      }

      await importPrivateKey(privateKey, password, name || undefined, currentChain)
      toast.success(`Private key imported on ${currentChain}`)
      setOpen(false)
      setPrivateKey("")
      setName("")
      setPassword("")
    } catch (error) {
      toast.error(`Import failed: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Private Key</DialogTitle>
          <DialogDescription>
            Import a {currentChain} private key as a new account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pk-name">Account Name (optional)</Label>
            <Input
              id="pk-name"
              placeholder="Imported Account"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="private-key">Private Key</Label>
            <Input
              id="private-key"
              type="password"
              placeholder="Paste private key"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Wallet Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Input wallet password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
