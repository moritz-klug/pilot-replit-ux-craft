import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const PromptInput = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
    onSubmit?: () => void
  }
>(({ className, value, onValueChange, onSubmit, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            onValueChange,
            onSubmit,
          })
        }
        return child
      })}
    </div>
  )
})
PromptInput.displayName = "PromptInput"

const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea> & {
    onValueChange?: (value: string) => void
    onSubmit?: () => void
  }
>(({ className, value, onValueChange, onSubmit, onKeyDown, ...props }, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit?.()
    }
    onKeyDown?.(e)
  }

  return (
    <Textarea
      ref={ref}
      className={cn(
        "min-h-[40px] flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 outline-none",
        className
      )}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
})
PromptInputTextarea.displayName = "PromptInputTextarea"

const PromptInputActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
))
PromptInputActions.displayName = "PromptInputActions"

export { PromptInput, PromptInputTextarea, PromptInputActions }