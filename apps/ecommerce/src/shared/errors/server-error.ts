import "server-only";

export type UnexpectedActionError = {
  ok: false;
  error: "UNEXPECTED";
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message) return message;
    return error.name || "Error sin mensaje";
  }
  if (typeof error === "string") return error;
  if (isRecord(error)) {
    const parts = [
      typeof error.message === "string" ? error.message : null,
      typeof error.code === "string" ? `code=${error.code}` : null,
      typeof error.details === "string" ? `details=${error.details}` : null,
      typeof error.hint === "string" ? `hint=${error.hint}` : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(" | ");
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Error desconocido";
  }
}

export function logServerError(scope: string, error: unknown): void {
  const message = getErrorMessage(error);
  console.error(`[${scope}] ${message}`, error);
}

export function logServerInfo(
  scope: string,
  message: string,
  details?: Record<string, unknown>,
): void {
  if (details) {
    console.info(`[${scope}] ${message}`, details);
    return;
  }
  console.info(`[${scope}] ${message}`);
}

export async function guardAction<T extends { ok: boolean }>(
  scope: string,
  run: () => Promise<T>,
): Promise<T | UnexpectedActionError> {
  try {
    return await run();
  } catch (error) {
    logServerError(scope, error);
    return { ok: false, error: "UNEXPECTED", message: getErrorMessage(error) };
  }
}
