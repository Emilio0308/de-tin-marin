import "server-only";

import { randomUUID } from "node:crypto";
import { getErrorMessage } from "./get-error-message";
import type { Logger } from "./logger";

export type UnexpectedActionError = {
  ok: false;
  error: "UNEXPECTED";
  message?: string;
};

export type GuardActionOptions = {
  logger: Logger;
  /** When true, include `message` on UNEXPECTED for admin backoffice. */
  includeUnexpectedMessage: boolean;
};

function createRequestId(): string {
  return randomUUID().slice(0, 8);
}

function extractErrorCode(result: { ok: boolean }): string | undefined {
  if (result.ok) return undefined;
  if (
    "error" in result &&
    typeof (result as { error?: unknown }).error === "string"
  ) {
    return (result as { error: string }).error;
  }
  return "UNKNOWN";
}

export async function withOperation<T extends { ok: boolean }>(
  options: GuardActionOptions,
  scope: string,
  run: () => Promise<T>,
  meta?: Record<string, unknown>,
): Promise<T | UnexpectedActionError> {
  const { logger, includeUnexpectedMessage } = options;
  const requestId = createRequestId();
  const startedAt = Date.now();

  logger.operation(scope, "started", { requestId, meta });

  try {
    const result = await run();
    const durationMs = Date.now() - startedAt;
    const errorCode = extractErrorCode(result);
    logger.operation(scope, "completed", {
      requestId,
      durationMs,
      ok: result.ok,
      errorCode,
      meta,
    });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = getErrorMessage(error);
    logger.operation(scope, "failed", {
      requestId,
      durationMs,
      ok: false,
      errorCode: "UNEXPECTED",
      message,
      meta,
    });
    logger.error(scope, error, { requestId, ...meta });

    if (includeUnexpectedMessage) {
      return { ok: false, error: "UNEXPECTED", message };
    }
    return { ok: false, error: "UNEXPECTED" };
  }
}

export async function guardAction<T extends { ok: boolean }>(
  options: GuardActionOptions,
  scope: string,
  run: () => Promise<T>,
): Promise<T | UnexpectedActionError> {
  return withOperation(options, scope, run);
}
