"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@de-tin-marin/ui/button";
import { cn } from "@de-tin-marin/shared/cn";
import type {
  ConfirmDialogOptions,
  ConfirmDialogProps,
} from "./confirm-dialog.types";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "destructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div
        aria-hidden
        className="bg-on-surface/55 absolute inset-0"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="border-outline-variant/30 bg-surface-container-lowest relative z-10 w-full max-w-md rounded-3xl border p-5 shadow-lg sm:p-6"
      >
        <h2 id={titleId} className="font-label text-label-bold text-on-surface">
          {title}
        </h2>
        <p
          id={descriptionId}
          className="font-body text-body-md text-on-surface-variant mt-2"
        >
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            autoFocus
            variant="secondary"
            onClick={onCancel}
            className="min-h-11 w-full touch-manipulation sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={cn(
              "min-h-11 w-full touch-manipulation sm:w-auto",
              variant === "destructive" &&
                "bg-error text-on-error hover:bg-error/90",
            )}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function useConfirmDialog() {
  const t = useTranslations("common.confirmDialog");
  const tCommon = useTranslations("common");
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback((nextOptions: ConfirmDialogOptions) => {
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(nextOptions);
      setOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    settle(true);
  }, [settle]);

  const handleCancel = useCallback(() => {
    settle(false);
  }, [settle]);

  const dialog = (
    <ConfirmDialog
      open={open && options !== null}
      title={options?.title ?? t("deleteTitle")}
      description={options?.description ?? ""}
      confirmLabel={options?.confirmLabel ?? t("delete")}
      cancelLabel={options?.cancelLabel ?? tCommon("cancel")}
      variant={options?.variant ?? "destructive"}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, dialog };
}
