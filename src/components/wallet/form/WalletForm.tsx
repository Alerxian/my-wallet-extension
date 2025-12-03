import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import z from "zod"

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
import { useWalletStore } from "~stores/walletStore"

const createWalletFormSchema = z
  .object({
    password: z.string().min(8, "密码至少8位"),
    confirmPassword: z.string().min(8, "确认密码至少8位")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入密码不一致",
    path: ["confirmPassword"]
  })

export const CreateWalletForm = () => {
  const createWallet = useWalletStore((s) => s.createWallet)
  const form = useForm({
    resolver: zodResolver(createWalletFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: z.infer<typeof createWalletFormSchema>) => {
    const { password } = data
    try {
      setLoading(true)
      await createWallet(password)
      toast.success("钱包创建成功")
    } catch (error) {
      console.error(error)
      toast.error("钱包创建失败")
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
                <FieldLabel htmlFor="password">设置密码</FieldLabel>
                <PasswordInput
                  {...field}
                  id="password"
                  aria-invalid={fieldState.invalid}
                  placeholder="输入密码，至少8位"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="confirmPassword">确认密码</FieldLabel>
                <Input
                  {...field}
                  id="confirmPassword"
                  type="password"
                  aria-invalid={fieldState.invalid}
                  placeholder="输入密码，至少8位"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        <Field orientation="horizontal">
          <LoadingButton
            type="submit"
            className="w-full"
            form="createWalletForm"
            loading={loading}>
            创建钱包
          </LoadingButton>
        </Field>
      </FieldSet>
    </form>
  )
}
