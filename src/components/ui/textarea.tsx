import * as React from "react"

import { cn } from "@/lib/utils"

/** Prose input. Same white, hairline and volt focus ring as Input, taller. */
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-input bg-canvas-raised px-3 py-2 text-base leading-relaxed text-ink transition-[border-color,box-shadow] outline-none placeholder:text-ink-faint focus-visible:border-volt focus-visible:ring-2 focus-visible:ring-[oklch(0.53_0.193_258/20%)] disabled:cursor-not-allowed disabled:opacity-50 md:text-small",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
