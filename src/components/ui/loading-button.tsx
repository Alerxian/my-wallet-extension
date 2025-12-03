// components/ui/loading-button.tsx
import { Loader2 } from "lucide-react"

import { Button } from "~/components/ui/button"
import type { ButtonProps } from "~/components/ui/button"

interface LoadingButtonProps extends ButtonProps {
  loading: boolean
  loadingText?: string
}

export function LoadingButton({
  loading,
  children,
  loadingText = "处理中...",
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={loading || disabled} // 合并原有 disabled 状态
      className="relative">
      {/* 加载状态 */}
      {loading && (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      )}
      {/* 非加载状态显示原内容 */}
      {!loading && children}
    </Button>
  )
}
