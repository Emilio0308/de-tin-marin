import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseConfig } from "./config";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export type UpdateSessionOptions = SupabaseConfig & {
  redirectIfUnauthed?: boolean;
  loginPath?: string;
  publicPrefixes?: readonly string[];
};

export async function updateSession(
  request: NextRequest,
  options: UpdateSessionOptions,
): Promise<NextResponse> {
  const {
    url,
    publishableKey,
    loginPath = "/login",
    publicPrefixes = ["/login", "/auth"],
    redirectIfUnauthed = false,
  } = options;

  let supabaseResponse = NextResponse.next({ request });

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

  const { data } = await supabase.auth.getUser();

  const isPublic = publicPrefixes.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );
  if (!data.user && redirectIfUnauthed && !isPublic) {
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
