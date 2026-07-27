"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, tick } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,opacity,border-color] duration-200 ease-[var(--ease-out-expo)] active:scale-[0.975] disabled:pointer-events-none disabled:opacity-35",
  {
    variants: {
      variant: {
        primary: "bg-text text-bg hover:opacity-90",
        gold: "bg-gold-vivid text-on-gold hover:brightness-105",
        outline:
          "border border-separator-strong bg-transparent text-text hover:bg-surface",
        ghost: "bg-transparent text-muted hover:text-text",
      },
      size: {
        // 56px: Apple's 44pt minimum plus comfort. Thumbs are not styluses.
        lg: "h-14 rounded-full px-8 text-[17px]",
        md: "h-12 rounded-full px-6 text-[16px]",
        sm: "h-10 rounded-full px-4 text-[15px]",
      },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "lg", full: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Fire a haptic tick on press. On by default for primary actions. */
  haptic?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, full, asChild = false, haptic = true, onClick, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, full }), className)}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (haptic) tick();
          onClick?.(e);
        }}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
