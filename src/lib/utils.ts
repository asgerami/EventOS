import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * The design system defines its own font-size scale in `globals.css`
 * (`--text-hero`, `--text-body`, `--text-small`, …). tailwind-merge has no
 * way to know those names are sizes, so it files `text-small` under
 * `text-color` and then drops any real colour written alongside it —
 * `cn("bg-volt text-white", "text-small")` was silently resolving to ink
 * type on a volt button.
 *
 * Registering the scale as font sizes keeps size and colour in separate
 * conflict groups, so both survive the merge.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-hero",
        "text-display-1",
        "text-display-2",
        "text-display-3",
        "text-index",
        "text-figure",
        "text-quote",
        "text-lede",
        "text-body",
        "text-small",
        "text-eyebrow",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
