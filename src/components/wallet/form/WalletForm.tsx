import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet
} from "~components/ui/field"
import { Input } from "~components/ui/input"
import { LoadingButton } from "~components/ui/loading-button"
import { PasswordInput } from "~components/ui/password-input"
import { Textarea } from "~components/ui/textarea"
import { useWalletStore } from "~stores/walletStore"

const createWalletFormSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 chars"),
    confirmPassword: z.string().min(8, "Confirm password is required")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  })

export const CreateWalletForm = () => {
  const currentChain = useWalletStore((state) => state.currentChain)
  const createWallet = useWalletStore((state) => state.createWallet)
  const form = useForm({
    resolver: zodResolver(createWalletFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: z.infer<typeof createWalletFormSchema>) => {
    try {
      setLoading(true)
      await createWallet(data.password, currentChain)
      toast.success(`Wallet created on ${currentChain}`)
    } catch (error) {
      console.error(error)
      toast.error(`Wallet creation failed: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="createWalletForm" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="password"
                  aria-invalid={fieldState.invalid}
                  placeholder="At least 8 characters"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                <Input
                  {...field}
                  id="confirmPassword"
                  type="password"
                  aria-invalid={fieldState.invalid}
                  placeholder="Repeat password"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <Field>
          <LoadingButton
            type="submit"
            className="w-full"
            form="createWalletForm"
            loading={loading}>
            Create Wallet
          </LoadingButton>
        </Field>
      </FieldSet>
    </form>
  )
}

const importWalletFormSchema = z.object({
  mnemonic: z.string().min(12, "Mnemonic is required"),
  password: z.string().min(8, "Password must be at least 8 chars")
})

export const ImportMnemonicForm = () => {
  const currentChain = useWalletStore((state) => state.currentChain)
  const importWallet = useWalletStore((state) => state.importWallet)
  const form = useForm({
    resolver: zodResolver(importWalletFormSchema),
    defaultValues: {
      mnemonic: "",
      password: ""
    }
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: z.infer<typeof importWalletFormSchema>) => {
    try {
      setLoading(true)
      await importWallet(data.mnemonic, data.password, currentChain)
      toast.success(`Wallet imported on ${currentChain}`)
    } catch (error) {
      console.error(error)
      toast.error(`Import failed: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="importWalletForm" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Controller
            name="mnemonic"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="mnemonic">Mnemonic</FieldLabel>
                <Textarea
                  {...field}
                  id="mnemonic"
                  rows={4}
                  aria-invalid={fieldState.invalid}
                  placeholder="Input mnemonic words separated by spaces"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="password"
                  aria-invalid={fieldState.invalid}
                  placeholder="Wallet password"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <Field orientation="horizontal">
          <LoadingButton
            type="submit"
            className="w-full"
            form="importWalletForm"
            loading={loading}>
            Import Wallet
          </LoadingButton>
        </Field>
      </FieldSet>
    </form>
  )
}

const importPrivateKeyFormSchema = z.object({
  privateKey: z.string().min(1, "Private key is required"),
  password: z.string().min(8, "Password must be at least 8 chars")
})

export const ImportPrivateKeyForm = () => {
  const currentChain = useWalletStore((state) => state.currentChain)
  const importPrivateKey = useWalletStore((state) => state.importPrivateKey)
  const form = useForm({
    resolver: zodResolver(importPrivateKeyFormSchema),
    defaultValues: {
      privateKey: "",
      password: ""
    }
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: z.infer<typeof importPrivateKeyFormSchema>) => {
    try {
      setLoading(true)
      await importPrivateKey(data.privateKey, data.password, undefined, currentChain)
      toast.success(`Private key imported on ${currentChain}`)
    } catch (error) {
      console.error(error)
      toast.error(`Import failed: ${(error as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form id="importPrivateKeyForm" onSubmit={form.handleSubmit(onSubmit)}>
      <FieldSet>
        <FieldGroup>
          <Controller
            name="privateKey"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="privateKey">Private Key</FieldLabel>
                <Input
                  {...field}
                  id="privateKey"
                  type="text"
                  aria-invalid={fieldState.invalid}
                  placeholder="Paste private key"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  {...field}
                  id="password"
                  aria-invalid={fieldState.invalid}
                  placeholder="Wallet password"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <Field orientation="horizontal">
          <LoadingButton
            type="submit"
            className="w-full"
            form="importPrivateKeyForm"
            loading={loading}>
            Import Private Key
          </LoadingButton>
        </Field>
      </FieldSet>
    </form>
  )
}
