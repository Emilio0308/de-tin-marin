import "server-only";

import {
  guardAction as guardActionCore,
  withOperation as withOperationCore,
  type UnexpectedActionError,
} from "./guard-action";
import { getErrorMessage } from "./get-error-message";
import { createLogger, type Logger } from "./logger";
import type { AppName } from "./types";

export type { UnexpectedActionError };
export { getErrorMessage };

export type ServerErrorHelpers = {
  logger: Logger;
  logServerError: (
    scope: string,
    error: unknown,
    meta?: Record<string, unknown>,
  ) => void;
  logServerInfo: (
    scope: string,
    message: string,
    details?: Record<string, unknown>,
  ) => void;
  logServerWarn: (
    scope: string,
    message: string,
    details?: Record<string, unknown>,
  ) => void;
  guardAction: <T extends { ok: boolean }>(
    scope: string,
    run: () => Promise<T>,
  ) => Promise<T | UnexpectedActionError>;
  withOperation: <T extends { ok: boolean }>(
    scope: string,
    run: () => Promise<T>,
    meta?: Record<string, unknown>,
  ) => Promise<T | UnexpectedActionError>;
};

export function createServerErrorHelpers(options: {
  app: AppName;
  includeUnexpectedMessage: boolean;
}): ServerErrorHelpers {
  const logger = createLogger({ app: options.app });
  const guardOptions = {
    logger,
    includeUnexpectedMessage: options.includeUnexpectedMessage,
  };

  return {
    logger,
    logServerError(scope, error, meta) {
      logger.error(scope, error, meta);
    },
    logServerInfo(scope, message, details) {
      logger.info(scope, message, details);
    },
    logServerWarn(scope, message, details) {
      logger.warn(scope, message, details);
    },
    guardAction(scope, run) {
      return guardActionCore(guardOptions, scope, run);
    },
    withOperation(scope, run, meta) {
      return withOperationCore(guardOptions, scope, run, meta);
    },
  };
}
