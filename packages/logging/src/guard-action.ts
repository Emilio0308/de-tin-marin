import "server-only";

import { randomUUID } from "node:crypto";
import { getErrorMessage } from "./get-error-message";
import type { Logger } from "./logger";
import { summarizeActionResult } from "./summarize";

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
  requestMeta?: Record<string, unknown>,
): Promise<T | UnexpectedActionError> {
  const { logger, includeUnexpectedMessage } = options;
  const requestId = createRequestId();
  const startedAt = Date.now();

  logger.operation(scope, "started", {
    requestId,
    meta: requestMeta ? { request: requestMeta } : undefined,
  });

  try {
    const result = await run();
    const durationMs = Date.now() - startedAt;
    const errorCode = extractErrorCode(result);
    const response = summarizeActionResult(result);
    logger.operation(scope, "completed", {
      requestId,
      durationMs,
      ok: result.ok,
      errorCode,
      meta: {
        ...(requestMeta ? { request: requestMeta } : {}),
        response,
      },
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
      meta: requestMeta ? { request: requestMeta } : undefined,
    });
    logger.error(scope, error, { requestId, ...requestMeta });

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
  requestMeta?: Record<string, unknown>,
): Promise<T | UnexpectedActionError> {
  return withOperation(options, scope, run, requestMeta);
}
