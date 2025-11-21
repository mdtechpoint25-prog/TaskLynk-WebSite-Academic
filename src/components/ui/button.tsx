import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-[var(--secondary)] hover:text-[var(--secondary-foreground)] hover:shadow active:translate-y-[1px]",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 active:translate-y-[1px]",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent/10 hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 active:translate-y-[1px]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] hover:shadow active:translate-y-[1px]",
        ghost:
          "hover:bg-accent/20 hover:text-accent-foreground dark:hover:bg-accent/50 active:translate-y-[1px]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 py-1.5 has-[>svg]:px-2.5",
        sm: "h-7 rounded-md gap-1 px-2.5 text-[11px] has-[>svg]:px-2",
        lg: "h-9 rounded-md px-4 text-sm has-[>svg]:px-3.5",
        icon: "size-8",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }