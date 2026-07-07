import "server-only";

export type UnexpectedActionError = {
  ok: false;
  error: "UNEXPECTED";
  message: string;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Error desconocido";
  }
}

export function logServerError(scope: string, error: unknown): void {
  console.error(`[${scope}] ${getErrorMessage(error)}`, error);
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
