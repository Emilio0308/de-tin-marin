import type { SelectHTMLAttributes } from "react";
import { cn } from "@de-tin-marin/shared/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
