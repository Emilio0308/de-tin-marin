export type AppName = "admin" | "ecommerce";

export type LogLevel = "info" | "warn" | "error";

export type OperationEvent = "started" | "completed" | "failed";

export type LogEvent = {
  ts: string;
  level: LogLevel;
  app: AppName;
  scope: string;
  event?: OperationEvent;
  requestId?: string;
  durationMs?: number;
  ok?: boolean;
  errorCode?: string;
  message?: string;
  meta?: Record<string, unknown>;
};
