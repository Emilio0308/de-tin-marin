import { type NextRequest } from "next/server";
import { getMiddlewareSupabaseConfig } from "@de-tin-marin/db/config";
import { updateSession } from "@de-tin-marin/db/proxy";

// Timing logs: MIDDLEWARE_TIMING_LOG=1 en Vercel o automático en development.
export async function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  return updateSession(request, {
    ...getMiddlewareSupabaseConfig(),
    app: "admin",
    redirectIfUnauthed: !isLogin,
    loginPath: "/login",
    publicPrefixes: ["/login", "/auth"],
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
