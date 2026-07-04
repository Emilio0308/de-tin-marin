import type { HTMLAttributes } from "react";
import { cn } from "@de-tin-marin/shared/cn";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "muted" | "secondary";
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "font-label inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide",
        variant === "default" && "bg-primary-fixed text-on-primary-fixed",
        variant === "success" &&
          "bg-secondary-container text-on-secondary-container",
        variant === "secondary" && "bg-secondary text-on-secondary",
        variant === "muted" &&
          "bg-surface-container-high text-on-surface-variant",
        className,
      )}
      {...props}
    />
  );
}
