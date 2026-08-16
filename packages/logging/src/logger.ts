import "server-only";

import { safeMeta } from "./redact";
import type { AppName, LogEvent, LogLevel, OperationEvent } from "./types";

export type Logger = {
  app: AppName;
  info: (
    scope: string,
    message: string,
    meta?: Record<string, unknown>,
  ) => void;
  warn: (
    scope: string,
    message: string,
    meta?: Record<string, unknown>,
  ) => void;
  error: (
    scope: string,
    error: unknown,
    meta?: Record<string, unknown>,
  ) => void;
  operation: (
    scope: string,
    event: OperationEvent,
    fields?: {
      requestId?: string;
      durationMs?: number;
      ok?: boolean;
      errorCode?: string;
      message?: string;
      meta?: Record<string, unknown>;
    },
  ) => void;
};

function write(level: LogLevel, event: LogEvent): void {
  const line = JSON.stringify(event);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function createLogger(options: { app: AppName }): Logger {
  const { app } = options;

  return {
    app,
    info(scope, message, meta) {
      write("info", {
        ts: new Date().toISOString(),
        level: "info",
        app,
        scope,
        message,
        meta: safeMeta(meta),
      });
    },
    warn(scope, message, meta) {
      write("warn", {
        ts: new Date().toISOString(),
        level: "warn",
        app,
        scope,
        message,
        meta: safeMeta(meta),
      });
    },
    error(scope, error, meta) {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : "Error desconocido";
      write("error", {
        ts: new Date().toISOString(),
        level: "error",
        app,
        scope,
        message,
        meta: safeMeta({
          ...meta,
          error:
            error instanceof Error
              ? { name: error.name, message: error.message }
              : error,
        }),
      });
    },
    operation(scope, event, fields = {}) {
      const level: LogLevel =
        event === "failed" || fields.ok === false ? "error" : "info";
      write(level, {
        ts: new Date().toISOString(),
        level,
        app,
        scope,
        event,
        requestId: fields.requestId,
        durationMs: fields.durationMs,
        ok: fields.ok,
        errorCode: fields.errorCode,
        message: fields.message,
        meta: safeMeta(fields.meta),
      });
    },
  };
}
