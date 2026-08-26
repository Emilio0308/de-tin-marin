"use client";

import { useEffect, useState, type ChangeEvent, type FocusEvent } from "react";
import {
  commitDecimalDraft,
  commitIntegerDraft,
  sanitizeDecimalDraft,
  sanitizeIntegerDraft,
  toDecimalDraft,
  toIntegerDraft,
} from "@/shared/forms/number-draft.helpers";
import type { GranularNumberInputProps } from "@/shared/forms/granular-number-input.types";

function formatFromValue(
  value: number | null,
  mode: GranularNumberInputProps["mode"],
): string {
  return mode === "integer" ? toIntegerDraft(value) : toDecimalDraft(value);
}

function tryParseDraft(
  draft: string,
  mode: GranularNumberInputProps["mode"],
): number | null {
  const trimmed = draft.trim();
  if (trimmed === "" || trimmed === ".") return null;
  if (mode === "integer") {
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function GranularNumberInput({
  value,
  onValueChange,
  mode,
  min,
  max,
  allowEmpty = false,
  emptyFallback,
  roundMoneyValue = true,
  onFocus,
  ...inputProps
}: GranularNumberInputProps) {
  const [draft, setDraft] = useState(() => formatFromValue(value, mode));
  const [focused, setFocused] = useState(false);

  const fallback = emptyFallback ?? (min !== undefined ? min : 0);

  useEffect(() => {
    if (!focused) {
      setDraft(formatFromValue(value, mode));
    }
  }, [value, mode, focused]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next =
      mode === "integer"
        ? sanitizeIntegerDraft(event.target.value)
        : sanitizeDecimalDraft(event.target.value);
    setDraft(next);

    if (allowEmpty && next === "") {
      onValueChange(null);
      return;
    }

    const parsed = tryParseDraft(next, mode);
    if (parsed !== null) {
      onValueChange(parsed);
    }
  }

  function handleBlur() {
    setFocused(false);

    if (allowEmpty && draft.trim() === "") {
      onValueChange(null);
      setDraft("");
      return;
    }

    const committed =
      mode === "integer"
        ? commitIntegerDraft(draft, { min, max, fallback })
        : commitDecimalDraft(draft, {
            min,
            max,
            fallback,
            roundMoneyValue,
          });

    onValueChange(committed);
    setDraft(formatFromValue(committed, mode));
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true);
    onFocus?.(event);
  }

  return (
    <input
      {...inputProps}
      type="text"
      inputMode={mode === "integer" ? "numeric" : "decimal"}
      value={draft}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
