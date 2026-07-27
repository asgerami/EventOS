import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Fields sit on white with a hairline and take a volt border plus a soft volt
 * ring on focus — the accent doing real work. They stay in the text face
 * (names, emails and venue names are prose) with tabular figures so numeric
 * entry still lines up.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-ink-faint selection:bg-volt selection:text-white h-10 w-full min-w-0 rounded-md border border-input bg-canvas-raised px-3 py-1 text-base text-ink tabular-nums transition-[border-color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-small",
        "focus-visible:border-volt focus-visible:ring-2 focus-visible:ring-[oklch(0.53_0.193_258/20%)]",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
