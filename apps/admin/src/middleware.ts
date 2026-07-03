import { type NextRequest } from "next/server";
import { updateSession } from "@de-tin-marin/db/proxy";
import { supabaseConfig } from "@/config/env";

export async function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  return updateSession(request, {
    ...supabaseConfig,
    redirectIfUnauthed: !isLogin,
    loginPath: "/login",
    publicPrefixes: ["/login", "/auth"],
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
