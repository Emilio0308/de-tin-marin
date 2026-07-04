import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@de-tin-marin/shared/cn";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "font-label inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-bold transition-all",
        variant === "primary" &&
          "bg-primary text-on-primary hover:bg-primary-container press-down",
        variant === "secondary" &&
          "border-secondary/40 bg-surface-container-lowest text-secondary hover:bg-secondary-container/30 border-2",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
