import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseConfig } from "./config";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export type UpdateSessionOptions = SupabaseConfig & {
  redirectIfUnauthed?: boolean;
  loginPath?: string;
  publicPrefixes?: readonly string[];
  /** Identificador para logs de timing (p. ej. "admin", "ecommerce"). */
  app?: string;
};

type MiddlewareTimingMeta = Record<string, unknown>;

/** Server Actions (POST + Next-Action) y non-GET no refrescan sesión en middleware. */
export function shouldRefreshSession(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  if (
    request.headers.has("next-action") ||
    request.headers.has("Next-Action")
  ) {
    return false;
  }
  return true;
}

function shouldLogMiddlewareTiming(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.MIDDLEWARE_TIMING_LOG === "1"
  );
}

function logMiddlewareTiming(
  message: string,
  meta: MiddlewareTimingMeta,
): void {
  if (!shouldLogMiddlewareTiming()) return;
  console.info(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      scope: "middleware.session",
      message,
      meta,
    }),
  );
}

export async function updateSession(
  request: NextRequest,
  options: UpdateSessionOptions,
): Promise<NextResponse> {
  if (!shouldRefreshSession(request)) {
    return NextResponse.next({ request });
  }

  const startedAt = Date.now();
  const pathname = request.nextUrl.pathname;
  const {
    url,
    publishableKey,
    loginPath = "/login",
    publicPrefixes = ["/login", "/auth"],
    redirectIfUnauthed = false,
    app = "unknown",
  } = options;

  let supabaseHost: string | undefined;
  try {
    supabaseHost = new URL(url).host;
  } catch {
    supabaseHost = "invalid-url";
  }

  logMiddlewareTiming("start", {
    app,
    pathname,
    cookieCount: request.cookies.getAll().length,
    supabaseHost,
  });

  let supabaseResponse = NextResponse.next({ request });

  const clientCreatedAt = Date.now();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) =>
          supabaseResponse.cookies.set(name, value, cookieOptions),
        );
      },
    },
  });

  const getUserStartedAt = Date.now();
  let authErrorMessage: string | undefined;
  let hasUser = false;

  try {
    const { data, error } = await supabase.auth.getUser();
    hasUser = data.user != null;
    if (error) {
      authErrorMessage = error.message;
    }
  } catch (error) {
    authErrorMessage =
      error instanceof Error ? error.message : "getUser threw unknown error";
    logMiddlewareTiming("getUser_failed", {
      app,
      pathname,
      supabaseHost,
      createClientMs: getUserStartedAt - clientCreatedAt,
      getUserMs: Date.now() - getUserStartedAt,
      totalMs: Date.now() - startedAt,
      authError: authErrorMessage,
    });
    throw error;
  }

  const getUserMs = Date.now() - getUserStartedAt;
  const isPublic = publicPrefixes.some((p) => pathname.startsWith(p));
  const shouldRedirect = !hasUser && redirectIfUnauthed && !isPublic;

  logMiddlewareTiming("end", {
    app,
    pathname,
    supabaseHost,
    createClientMs: getUserStartedAt - clientCreatedAt,
    getUserMs,
    totalMs: Date.now() - startedAt,
    hasUser,
    isPublic,
    shouldRedirect,
    outcome: shouldRedirect ? "redirect_login" : "next",
    authError: authErrorMessage,
  });

  if (shouldRedirect) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = loginPath;
    const redirectResponse = NextResponse.redirect(redirectUrl);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return supabaseResponse;
}
