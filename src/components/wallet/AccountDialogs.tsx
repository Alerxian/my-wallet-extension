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

  const createAccount = useWalletStore((state) => state.createAccount)
  const storedPassword = useWalletStore((state) => state.password)

  const handleCreate = async () => {
    if (!password) {
      toast.error("请输入钱包密码")
      return
    }

    setIsLoading(true)
    try {
      // 验证密码

      const inputHash = SHA256(password).toString()
      if (inputHash !== storedPassword) {
        throw new Error("密码错误")
      }

      await createAccount(password, name || undefined)
      toast.success("账户创建成功")
      setOpen(false)
      setName("")
      setPassword("")
    } catch (error) {
      toast.error("账户创建失败: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">创建</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建新账户</DialogTitle>
          <DialogDescription>
            这将从您的助记词派生一个新的账户地址。需要验证密码。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">账户名称 (可选)</Label>
            <Input
              id="name"
              placeholder="例如: Account 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-password">钱包密码</Label>
            <Input
              id="create-password"
              type="password"
              placeholder="请输入当前钱包密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建
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

  const importPrivateKey = useWalletStore((state) => state.importPrivateKey)
  const storedPassword = useWalletStore((state) => state.password)

  const handleImport = async () => {
    if (!privateKey) {
      toast.error("请输入私钥")
      return
    }
    if (!password) {
      toast.error("请输入钱包密码以加密存储私钥")
      return
    }

    setIsLoading(true)
    try {
      const inputHash = SHA256(password).toString()
      if (inputHash !== storedPassword) {
        throw new Error("密码错误")
      }

      await importPrivateKey(privateKey, password, name || undefined)
      toast.success("私钥导入成功")
      setOpen(false)
      setPrivateKey("")
      setName("")
      setPassword("")
    } catch (error) {
      toast.error("导入失败: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">导入</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>导入私钥</DialogTitle>
          <DialogDescription>
            导入外部私钥作为新账户。请确保您的私钥安全。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="pk-name">账户名称 (可选)</Label>
            <Input
              id="pk-name"
              placeholder="例如: Imported Account 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="private-key">私钥</Label>
            <Input
              id="private-key"
              type="password"
              placeholder="0x..."
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">钱包密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入当前钱包密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
