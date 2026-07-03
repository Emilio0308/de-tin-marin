import type { HTMLAttributes } from "react";
import { cn } from "@de-tin-marin/shared/cn";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "muted";
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default" && "bg-rose-100 text-rose-800",
        variant === "success" && "bg-green-100 text-green-800",
        variant === "muted" && "bg-zinc-100 text-zinc-600",
        className,
      )}
      {...props}
    />
  );
}
