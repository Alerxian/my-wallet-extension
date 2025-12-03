// components/ui/password-input.tsx
import { Eye, EyeOff } from "lucide-react"
import { useState, type InputHTMLAttributes } from "react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export function PasswordInput({
  defaultValue = "",
  onValueChange,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [value, setValue] = useState(defaultValue)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    onValueChange?.(e.target.value)
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={handleChange}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setShowPassword(!showPassword)}
        className="shrink-0">
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </Button>
    </div>
  )
}
