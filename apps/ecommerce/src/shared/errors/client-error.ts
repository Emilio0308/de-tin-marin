/**
 * Client-side error logging (browser console).
 * Server Actions must use `logServerError` from `server-error.ts`.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Error desconocido";
  }
}

export function logClientError(scope: string, error: unknown): void {
  console.error(`[${scope}] ${getErrorMessage(error)}`, error);
}
