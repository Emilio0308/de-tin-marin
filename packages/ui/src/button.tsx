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
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
        variant === "primary"
          ? "bg-rose-600 text-white hover:bg-rose-700"
          : "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
