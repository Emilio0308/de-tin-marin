import "server-only";

import { createServerErrorHelpers } from "@de-tin-marin/logging/server-error";

const helpers = createServerErrorHelpers({
  app: "ecommerce",
  includeUnexpectedMessage: false,
});

export type { UnexpectedActionError } from "@de-tin-marin/logging/server-error";
export { getErrorMessage } from "@de-tin-marin/logging/server-error";

export const logServerError = helpers.logServerError;
export const logServerInfo = helpers.logServerInfo;
export const logServerWarn = helpers.logServerWarn;
export const guardAction = helpers.guardAction;
export const withOperation = helpers.withOperation;
