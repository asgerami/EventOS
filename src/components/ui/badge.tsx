import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * A badge is a small printed tag, not a shouty pill: text face, tight radius,
 * one hairline. It labels a thing; it never competes with a heading.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-semibold leading-5 tracking-[0.01em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt",
  {
    variants: {
      variant: {
        default:
          "border-[oklch(0.53_0.193_258/28%)] bg-volt-wash text-volt-deep",
        secondary: "border-rule bg-canvas-sunk text-ink-soft",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "border-rule-strong bg-transparent text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
