import type { LabelHTMLAttributes } from "react";
import { cn } from "@de-tin-marin/shared/cn";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none text-zinc-700",
        className,
      )}
      {...props}
    />
  );
}
