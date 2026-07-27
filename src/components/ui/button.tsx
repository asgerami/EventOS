import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Controls are crisp rectangles with a small radius, set in the text face at
 * semibold. Volt is reserved for the one primary action on a screen;
 * everything else is a hairline or a plain word.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold tracking-[-0.005em] transition-[background-color,border-color,color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-volt aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-volt text-white hover:bg-volt-deep",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-destructive",
        outline:
          "border border-rule-strong bg-canvas-raised text-ink hover:border-volt hover:text-volt",
        secondary: "bg-canvas-tint text-ink hover:bg-[oklch(0.885_0.01_252)]",
        ghost: "text-ink-soft hover:bg-canvas-tint hover:text-ink",
        link: "px-0 text-volt link-underline hover:text-volt-deep",
      },
      size: {
        default: "h-10 px-4 text-small has-[>svg]:px-3.5",
        xs: "h-7 gap-1 rounded-sm px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 text-small has-[>svg]:px-2.5",
        lg: "h-12 px-6 text-base has-[>svg]:px-5",
        icon: "size-10",
        "icon-xs": "size-7 rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
