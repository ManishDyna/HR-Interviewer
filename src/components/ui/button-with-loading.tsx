import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ButtonWithLoadingProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

const ButtonWithLoading = React.forwardRef<HTMLButtonElement, ButtonWithLoadingProps>(
  ({ className, children, loading, loadingText, disabled, ...props }, ref) => {
    return (
      <Button
        className={cn(className)}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)
ButtonWithLoading.displayName = "ButtonWithLoading"

export { ButtonWithLoading }

