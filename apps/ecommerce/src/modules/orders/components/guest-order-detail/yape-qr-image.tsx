"use client";

import {
  Component,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

export const YAPE_QR_SRC = "/brand/emilio-rivas-yape-qr.jpeg";

type ImageStatus = "pending" | "ready" | "failed";

class SilentQrErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return null;
    }

    return this.props.children;
  }
}

function isRenderableQr(image: HTMLImageElement): boolean {
  return image.naturalWidth > 0 && image.naturalHeight > 0;
}

function YapeQrLightbox({
  titleId,
  title,
  alt,
  closeLabel,
  onClose,
}: {
  titleId: string;
  title: string;
  alt: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [enlargedFailed, setEnlargedFailed] = useState(false);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  if (enlargedFailed) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6">
      <div
        aria-hidden
        className="bg-on-surface/55 absolute inset-0"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="border-outline-variant/30 bg-surface-container-lowest relative z-10 w-full max-w-md rounded-3xl border p-4 shadow-lg sm:p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="font-label text-label-bold text-on-surface pr-2"
          >
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="text-on-surface-variant hover:bg-surface-container-high focus-visible:ring-primary flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 active:scale-[0.97]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- QR estático; onError debe ocultarlo */}
        <img
          src={YAPE_QR_SRC}
          alt={alt}
          width={480}
          height={480}
          decoding="async"
          onError={() => {
            setEnlargedFailed(true);
            onClose();
          }}
          className="mx-auto max-h-[min(70dvh,28rem)] w-full max-w-full rounded-2xl object-contain"
        />
      </div>
    </div>,
    document.body,
  );
}

function YapeQrImageInner() {
  const t = useTranslations("orderConfirmation.paymentInstructions");
  const titleId = useId();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [status, setStatus] = useState<ImageStatus>("pending");
  const [isOpen, setIsOpen] = useState(false);

  const markReady = useCallback(() => {
    setStatus("ready");
  }, []);

  const markFailed = useCallback(() => {
    setStatus("failed");
    setIsOpen(false);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  const syncFromElement = useCallback(
    (image: HTMLImageElement) => {
      try {
        if (!image.src || image.src.trim() === "") {
          markFailed();
          return;
        }

        if (isRenderableQr(image)) {
          markReady();
          return;
        }

        if (image.complete) {
          markFailed();
        }
      } catch {
        markFailed();
      }
    },
    [markFailed, markReady],
  );

  const setImageRef = useCallback(
    (image: HTMLImageElement | null) => {
      imageRef.current = image;
      if (!image) {
        return;
      }
      syncFromElement(image);
    },
    [syncFromElement],
  );

  if (status === "failed") {
    return null;
  }

  const isReady = status === "ready";

  return (
    <>
      <figure
        className={
          isReady
            ? "flex shrink-0 flex-col items-center gap-2 sm:items-end"
            : "sr-only"
        }
        aria-hidden={!isReady}
      >
        <button
          ref={triggerRef}
          type="button"
          disabled={!isReady}
          aria-label={t("yapeQrEnlarge")}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => {
            if (!isReady) {
              return;
            }
            setIsOpen(true);
          }}
          className="border-outline-variant/40 bg-surface-container-lowest focus-visible:ring-primary inline-flex min-h-11 min-w-11 touch-manipulation rounded-2xl border p-1.5 shadow-sm transition-transform duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 active:scale-[0.97]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- QR estático; onError/onLoad controlan visibilidad */}
          <img
            ref={setImageRef}
            src={YAPE_QR_SRC}
            alt={isReady ? t("yapeQrAlt") : ""}
            width={128}
            height={128}
            decoding="async"
            onLoad={() => {
              const image = imageRef.current;
              if (!image) {
                markFailed();
                return;
              }
              if (isRenderableQr(image)) {
                markReady();
                return;
              }
              markFailed();
            }}
            onError={markFailed}
            className="h-28 w-28 rounded-xl object-contain sm:h-32 sm:w-32"
          />
        </button>
        {isReady ? (
          <figcaption className="font-body text-body-sm text-on-surface-variant max-w-32 text-center sm:text-right">
            {t("yapeQrHint")}
          </figcaption>
        ) : null}
      </figure>
      {isOpen && isReady ? (
        <YapeQrLightbox
          titleId={titleId}
          title={t("yapeQrDialogTitle")}
          alt={t("yapeQrAlt")}
          closeLabel={t("yapeQrClose")}
          onClose={closeLightbox}
        />
      ) : null}
    </>
  );
}

export function YapeQrImage() {
  return (
    <SilentQrErrorBoundary>
      <YapeQrImageInner />
    </SilentQrErrorBoundary>
  );
}
